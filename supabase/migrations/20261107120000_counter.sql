-- Counter mode: in-store sales, refill bottles, cash taken out and the daily close.
-- Everything here is admin-only. The counter reads one function (counter_state) and changes things only through the
-- functions below, which check the signed-in user, lock the stock they touch and refuse anything after the day is closed.

alter table public.products add column if not exists barcode text;
alter table public.products drop constraint if exists products_barcode_length;
alter table public.products add constraint products_barcode_length check (barcode is null or char_length(barcode) between 1 and 64);
create unique index if not exists products_barcode_key on public.products (barcode) where barcode is not null;

-- The shop's day runs on Pakistan time.
create or replace function public.shop_day()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Karachi')::date $$;

create or replace function public.day_start(d date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$ select d::timestamp at time zone 'Asia/Karachi' $$;

create or replace function public.require_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can use the counter' using errcode = '42501';
  end if;
end;
$$;

-- One row per day: the cash the drawer started with, and the frozen result once the day is closed.
create table if not exists public.counter_days (
  day date primary key,
  opening_cash integer not null default 0 check (opening_cash >= 0),
  closed_at timestamptz,
  closed_by uuid,
  counted_cash integer check (counted_cash >= 0),
  expected_cash integer,
  difference integer,
  summary jsonb
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  created_by uuid,
  pay text not null check (char_length(pay) between 1 and 30),
  total integer not null check (total >= 0),
  given integer check (given >= 0),
  -- What the goods cost when they were sold. Never shown at the counter.
  cost numeric(14, 6) not null default 0 check (cost >= 0),
  voided_at timestamptz,
  voided_by uuid,
  void_reason text not null default ''
);
create index if not exists sales_created_idx on public.sales (created_at desc);

create table if not exists public.sale_lines (
  id bigint generated always as identity primary key,
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  unit_cost numeric(14, 6) not null default 0 check (unit_cost >= 0)
);
create index if not exists sale_lines_sale_idx on public.sale_lines (sale_id);
create index if not exists sale_lines_product_idx on public.sale_lines (product_id);

-- A bottle opened to refill customers' own bottles. It stays open until staff finish it, however many days that takes.
create table if not exists public.refill_bottles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  opened_at timestamptz not null default now(),
  opened_by uuid,
  -- What the bottle cost, saved when it was opened.
  cost numeric(14, 6) not null check (cost > 0),
  finished_at timestamptz,
  finished_by uuid
);
create index if not exists refill_bottles_open_idx on public.refill_bottles (opened_at desc) where finished_at is null;
create index if not exists refill_bottles_product_idx on public.refill_bottles (product_id);

create table if not exists public.refill_entries (
  id bigint generated always as identity primary key,
  bottle_id uuid not null references public.refill_bottles (id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  created_by uuid,
  undone_at timestamptz
);
create index if not exists refill_entries_bottle_idx on public.refill_entries (bottle_id);
create index if not exists refill_entries_created_idx on public.refill_entries (created_at desc);

create table if not exists public.cash_outs (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  amount integer not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 120),
  created_at timestamptz not null default now(),
  created_by uuid,
  removed_at timestamptz
);
create index if not exists cash_outs_day_idx on public.cash_outs (day);

-- Admins can read all of it; nobody can write to the tables directly.
do $$
declare t text;
begin
  foreach t in array array['counter_days', 'sales', 'sale_lines', 'refill_bottles', 'refill_entries', 'cash_outs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
    execute format('drop policy if exists "Admins read %s" on public.%I', t, t);
    execute format('create policy "Admins read %s" on public.%I for select to authenticated using ((select auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')', t, t);
  end loop;
end $$;

-- A sale in the shape the counter uses.
create or replace function public.sale_json(s public.sales)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', s.id,
    'number', s.number,
    'time', to_char(s.created_at at time zone 'Asia/Karachi', 'HH24:MI'),
    'lines', coalesce((select jsonb_agg(jsonb_build_object('itemId', l.product_id, 'name', l.name, 'price', l.unit_price, 'quantity', l.quantity) order by l.id) from public.sale_lines l where l.sale_id = s.id), '[]'::jsonb),
    'total', s.total,
    'pay', s.pay,
    'given', s.given,
    'voided', s.voided_at is not null
  )
$$;

-- A refill bottle in the shape the counter uses. The cost is only given out once the bottle is finished.
create or replace function public.bottle_json(b public.refill_bottles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'flavor', b.name,
    'openedOn', to_char(b.opened_at at time zone 'Asia/Karachi', 'DD Mon'),
    'cost', case when b.finished_at is null then null else b.cost end,
    'entries', coalesce((select jsonb_agg(e.amount order by e.id) from public.refill_entries e where e.bottle_id = b.id and e.undone_at is null), '[]'::jsonb),
    'finished', b.finished_at is not null
  )
$$;

-- Makes sure today has a row, and refuses changes once it has been closed.
create or replace function public.open_day()
returns public.counter_days
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day public.counter_days;
begin
  insert into public.counter_days (day) values (public.shop_day()) on conflict (day) do nothing;
  select * into v_day from public.counter_days where day = public.shop_day() for update;
  if v_day.closed_at is not null then raise exception 'day_closed'; end if;
  return v_day;
end;
$$;

-- Everything the counter screen needs, in one go.
create or replace function public.counter_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := public.shop_day();
  v_day public.counter_days;
  v_from timestamptz := public.day_start(public.shop_day());
  v_to timestamptz := public.day_start(public.shop_day() + 1);
begin
  perform public.require_admin();
  insert into public.counter_days (day) values (d) on conflict (day) do nothing;
  select * into v_day from public.counter_days where day = d;
  return jsonb_build_object(
    'day', d,
    'opening', v_day.opening_cash,
    'closed', v_day.closed_at is not null,
    'closing', case when v_day.closed_at is null then null else jsonb_build_object('counted', v_day.counted_cash, 'expected', v_day.expected_cash, 'difference', v_day.difference) end,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'code', coalesce(p.barcode, ''), 'name', p.name, 'shelf', p.category, 'type', p.type, 'price', p.price, 'stock', p.stock) order by p.position) from public.products p where p.stock is not null), '[]'::jsonb),
    'sales', coalesce((select jsonb_agg(public.sale_json(s) order by s.number) from public.sales s where s.created_at >= v_from and s.created_at < v_to), '[]'::jsonb),
    'bottles', coalesce((select jsonb_agg(public.bottle_json(b) order by b.opened_at) from public.refill_bottles b where b.finished_at is null or b.finished_at >= public.day_start(d - 30)), '[]'::jsonb),
    'refillsToday', coalesce((select sum(e.amount) from public.refill_entries e where e.undone_at is null and e.created_at >= v_from and e.created_at < v_to), 0),
    'refillsAll', coalesce((select sum(e.amount) from public.refill_entries e where e.undone_at is null), 0),
    'cashOuts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'amount', c.amount, 'note', c.note) order by c.created_at) from public.cash_outs c where c.day = d and c.removed_at is null), '[]'::jsonb)
  );
end;
$$;

-- Rings up a sale. Prices come from the products table, never from the screen. Draft: { pay, given, lines: [{ productId, quantity }] }
create or replace function public.counter_sell(draft jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  prod public.products%rowtype;
  v_pay text := btrim(coalesce(draft ->> 'pay', ''));
  v_given integer;
  v_qty integer;
  v_cost numeric;
  v_total integer := 0;
  v_cost_total numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_used jsonb := '{}'::jsonb;
  v_sale public.sales;
  r record;
begin
  perform public.require_admin();
  perform public.open_day();
  if char_length(v_pay) not between 1 and 30 then raise exception 'invalid_sale: pay'; end if;
  if jsonb_typeof(draft -> 'lines') is distinct from 'array' or jsonb_array_length(draft -> 'lines') not between 1 and 60 then raise exception 'invalid_sale: lines'; end if;
  v_given := case when coalesce(draft ->> 'given', '') ~ '^[0-9]+$' then (draft ->> 'given')::integer else null end;

  perform 1 from public.products
  where id in (select (value ->> 'productId')::uuid from jsonb_array_elements(draft -> 'lines'))
  order by id
  for update;

  for item in select value from jsonb_array_elements(draft -> 'lines') loop
    v_qty := (item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 999 then raise exception 'invalid_sale: quantity'; end if;
    select * into prod from public.products where id = (item ->> 'productId')::uuid;
    if not found or prod.stock is null then raise exception 'unavailable: %', coalesce(item ->> 'productId', ''); end if;
    v_used := jsonb_set(v_used, array[prod.id::text], to_jsonb(coalesce((v_used ->> prod.id::text)::integer, 0) + v_qty));
    if prod.stock < (v_used ->> prod.id::text)::integer then raise exception 'out_of_stock: %', prod.name; end if;
    select unit_cost into v_cost from public.product_costs where product_id = prod.id;
    v_cost := coalesce(v_cost, 0);
    v_total := v_total + prod.price * v_qty;
    v_cost_total := v_cost_total + v_cost * v_qty;
    v_lines := v_lines || jsonb_build_object('product_id', prod.id, 'name', prod.name, 'quantity', v_qty, 'unit_price', prod.price, 'unit_cost', v_cost);
  end loop;

  if v_given is not null and lower(v_pay) = 'cash' and v_given < v_total then raise exception 'invalid_sale: given'; end if;

  insert into public.sales (created_by, pay, total, given, cost)
  values (auth.uid(), v_pay, v_total, case when lower(v_pay) = 'cash' then v_given else null end, v_cost_total)
  returning * into v_sale;

  insert into public.sale_lines (sale_id, product_id, name, quantity, unit_price, unit_cost)
  select v_sale.id, x.product_id, x.name, x.quantity, x.unit_price, x.unit_cost
  from jsonb_to_recordset(v_lines) as x(product_id uuid, name text, quantity integer, unit_price integer, unit_cost numeric);

  perform set_config('app.stock_reason', 'sale', true);
  perform set_config('app.stock_note', 'Sale ' || v_sale.number, true);
  for r in select key, value from jsonb_each_text(v_used) loop
    update public.products set stock = stock - r.value::integer where id = r.key::uuid;
  end loop;

  return public.sale_json(v_sale);
end;
$$;

-- Cancels a sale made by mistake today: the goods go back on the shelf and the money leaves the day's totals.
create or replace function public.counter_void(p_sale uuid, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.sales;
  l record;
begin
  perform public.require_admin();
  perform public.open_day();
  select * into v_sale from public.sales where id = p_sale for update;
  if not found then raise exception 'not_found'; end if;
  if v_sale.voided_at is not null then raise exception 'already_voided'; end if;
  if (v_sale.created_at at time zone 'Asia/Karachi')::date <> public.shop_day() then raise exception 'old_sale'; end if;

  perform set_config('app.stock_reason', 'void', true);
  perform set_config('app.stock_note', 'Sale ' || v_sale.number, true);
  for l in select product_id, quantity from public.sale_lines where sale_id = v_sale.id and product_id is not null order by product_id loop
    update public.products set stock = stock + l.quantity where id = l.product_id and stock is not null;
  end loop;

  update public.sales set voided_at = now(), voided_by = auth.uid(), void_reason = left(coalesce(p_reason, ''), 200) where id = v_sale.id returning * into v_sale;
  return public.sale_json(v_sale);
end;
$$;

-- Opens a bottle for refills. It comes off the stock and its cost is saved on the record.
create or replace function public.counter_open_bottle(p_product uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  prod public.products%rowtype;
  v_cost numeric;
  v_bottle public.refill_bottles;
begin
  perform public.require_admin();
  perform public.open_day();
  select * into prod from public.products where id = p_product for update;
  if not found or prod.category <> 'bottle' or prod.stock is null then raise exception 'unavailable'; end if;
  if prod.stock < 1 then raise exception 'out_of_stock: %', prod.name; end if;
  select unit_cost into v_cost from public.product_costs where product_id = prod.id;
  if v_cost is null or v_cost <= 0 then raise exception 'no_cost: %', prod.name; end if;

  perform set_config('app.stock_reason', 'refill', true);
  perform set_config('app.stock_note', 'Opened for refills', true);
  update public.products set stock = stock - 1 where id = prod.id;

  insert into public.refill_bottles (product_id, name, opened_by, cost) values (prod.id, prod.name, auth.uid(), v_cost) returning * into v_bottle;
  return public.bottle_json(v_bottle);
end;
$$;

create or replace function public.counter_add_refill(p_bottle uuid, p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bottle public.refill_bottles;
begin
  perform public.require_admin();
  perform public.open_day();
  if p_amount is null or p_amount < 1 or p_amount > 1000000 then raise exception 'invalid_refill: amount'; end if;
  select * into v_bottle from public.refill_bottles where id = p_bottle for update;
  if not found or v_bottle.finished_at is not null then raise exception 'not_found'; end if;
  insert into public.refill_entries (bottle_id, amount, created_by) values (v_bottle.id, p_amount, auth.uid());
  return public.bottle_json(v_bottle);
end;
$$;

-- Takes back the last refill typed, but only if it was made today.
create or replace function public.counter_undo_refill(p_bottle uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bottle public.refill_bottles;
  v_entry public.refill_entries;
begin
  perform public.require_admin();
  perform public.open_day();
  select * into v_bottle from public.refill_bottles where id = p_bottle for update;
  if not found or v_bottle.finished_at is not null then raise exception 'not_found'; end if;
  select * into v_entry from public.refill_entries where bottle_id = v_bottle.id and undone_at is null order by id desc limit 1 for update;
  if not found then raise exception 'not_found'; end if;
  if (v_entry.created_at at time zone 'Asia/Karachi')::date <> public.shop_day() then raise exception 'old_entry'; end if;
  update public.refill_entries set undone_at = now() where id = v_entry.id;
  return public.bottle_json(v_bottle);
end;
$$;

create or replace function public.counter_finish_bottle(p_bottle uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bottle public.refill_bottles;
begin
  perform public.require_admin();
  perform public.open_day();
  select * into v_bottle from public.refill_bottles where id = p_bottle for update;
  if not found or v_bottle.finished_at is not null then raise exception 'not_found'; end if;
  update public.refill_bottles set finished_at = now(), finished_by = auth.uid() where id = v_bottle.id returning * into v_bottle;
  return public.bottle_json(v_bottle);
end;
$$;

create or replace function public.counter_set_opening(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  perform public.open_day();
  if p_amount is null or p_amount < 0 or p_amount > 100000000 then raise exception 'invalid_opening'; end if;
  update public.counter_days set opening_cash = p_amount where day = public.shop_day();
  return p_amount;
end;
$$;

create or replace function public.counter_add_cash_out(p_amount integer, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_out public.cash_outs;
begin
  perform public.require_admin();
  perform public.open_day();
  if p_amount is null or p_amount < 1 or p_amount > 100000000 then raise exception 'invalid_cash_out'; end if;
  insert into public.cash_outs (day, amount, note, created_by)
  values (public.shop_day(), p_amount, left(coalesce(nullif(btrim(p_note), ''), 'Cash out'), 120), auth.uid())
  returning * into v_out;
  return jsonb_build_object('id', v_out.id, 'amount', v_out.amount, 'note', v_out.note);
end;
$$;

create or replace function public.counter_remove_cash_out(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  perform public.open_day();
  update public.cash_outs set removed_at = now() where id = p_id and day = public.shop_day() and removed_at is null;
  if not found then raise exception 'not_found'; end if;
end;
$$;

-- Closes the day: works out what the drawer should hold, compares it with the count, and freezes the result.
create or replace function public.counter_close_day(p_counted integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := public.shop_day();
  v_day public.counter_days;
  v_from timestamptz := public.day_start(public.shop_day());
  v_to timestamptz := public.day_start(public.shop_day() + 1);
  v_by_pay jsonb;
  v_cash integer;
  v_refills integer;
  v_outs integer;
  v_expected integer;
begin
  perform public.require_admin();
  v_day := public.open_day();
  if p_counted is null or p_counted < 0 or p_counted > 100000000 then raise exception 'invalid_count'; end if;

  select coalesce(jsonb_object_agg(pay, total), '{}'::jsonb) into v_by_pay
  from (select pay, sum(total)::integer as total from public.sales where created_at >= v_from and created_at < v_to and voided_at is null group by pay) t;
  v_cash := coalesce((select sum(total) from public.sales where created_at >= v_from and created_at < v_to and voided_at is null and lower(pay) = 'cash'), 0);
  v_refills := coalesce((select sum(amount) from public.refill_entries where undone_at is null and created_at >= v_from and created_at < v_to), 0);
  v_outs := coalesce((select sum(amount) from public.cash_outs where day = d and removed_at is null), 0);
  v_expected := v_day.opening_cash + v_cash + v_refills - v_outs;

  update public.counter_days
  set closed_at = now(), closed_by = auth.uid(), counted_cash = p_counted, expected_cash = v_expected, difference = p_counted - v_expected,
      summary = jsonb_build_object('opening', v_day.opening_cash, 'salesByPay', v_by_pay, 'refills', v_refills, 'cashOuts', v_outs)
  where day = d;

  return jsonb_build_object('counted', p_counted, 'expected', v_expected, 'difference', p_counted - v_expected);
end;
$$;

-- Only signed-in admins may call the counter functions (each one checks the role again). The helpers stay private.
do $$
declare f text;
begin
  foreach f in array array[
    'counter_state()', 'counter_sell(jsonb)', 'counter_void(uuid, text)', 'counter_open_bottle(uuid)', 'counter_add_refill(uuid, integer)',
    'counter_undo_refill(uuid)', 'counter_finish_bottle(uuid)', 'counter_set_opening(integer)', 'counter_add_cash_out(integer, text)',
    'counter_remove_cash_out(uuid)', 'counter_close_day(integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['open_day()', 'require_admin()', 'sale_json(public.sales)', 'bottle_json(public.refill_bottles)', 'shop_day()', 'day_start(date)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
