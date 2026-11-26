-- VapologyX Loyalty Club (owner's answers, 2026-11-26).
--  * Customers are known by their mobile number. Shop and online points are two separate balances, never mixed.
--  * Earn 1 point per Rs 100 paid on full-price items only: not on discounted bills, sale items, refills or delivery.
--    Online orders earn only once delivered.
--  * 1 point = Rs 1. A customer needs at least 1,000 points to use them, and points can pay at most 20% of a bill.
--  * Every batch of points expires 12 months after it was earned. Points are used oldest first.
--  * Only admins change balances by hand, and every change needs a reason.

-- 1. Customers and their points history.
create table if not exists public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^03[0-9]{9}$'),
  name text not null default '' check (char_length(name) <= 120),
  shop_since timestamptz,
  online_since timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Each row is one change. Rows that add points are a "batch": remaining is what is left of it, and it stops counting at expires_at.
create table if not exists public.loyalty_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers (id) on delete cascade,
  channel text not null check (channel in ('shop', 'online')),
  kind text not null check (kind in ('earn', 'redeem', 'adjust', 'reverse')),
  points integer not null check (points <> 0),
  remaining integer not null default 0 check (remaining >= 0 and remaining <= greatest(points, 0)),
  expires_at timestamptz,
  sale_id uuid references public.sales (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  created_by uuid
);
create index if not exists loyalty_entries_batches_idx on public.loyalty_entries (customer_id, channel, expires_at) where remaining > 0;
create index if not exists loyalty_entries_customer_idx on public.loyalty_entries (customer_id, created_at desc);

alter table public.loyalty_customers enable row level security;
alter table public.loyalty_entries enable row level security;
revoke all on table public.loyalty_customers, public.loyalty_entries from anon, authenticated;
grant select on table public.loyalty_customers, public.loyalty_entries to authenticated;
grant select, insert, update, delete on table public.loyalty_customers, public.loyalty_entries to service_role;
drop policy if exists "Admins read loyalty_customers" on public.loyalty_customers;
create policy "Admins read loyalty_customers" on public.loyalty_customers for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins read loyalty_entries" on public.loyalty_entries;
create policy "Admins read loyalty_entries" on public.loyalty_entries for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 2. Points on sales and orders.
alter table public.sales add column if not exists customer_id uuid references public.loyalty_customers (id) on delete set null;
alter table public.sales add column if not exists points_used integer not null default 0 check (points_used >= 0);
alter table public.sales add column if not exists points_earned integer not null default 0 check (points_earned >= 0);
alter table public.sale_lines add column if not exists on_sale boolean not null default false;
alter table public.orders add column if not exists customer_id uuid references public.loyalty_customers (id) on delete set null;
alter table public.orders add column if not exists points_base integer;
alter table public.orders add column if not exists points_used integer not null default 0 check (points_used >= 0);
alter table public.orders add column if not exists points_earned integer not null default 0 check (points_earned >= 0);

-- A sale line remembers whether the product was "On sale" when it was sold (sale items earn no points).
create or replace function public.sale_lines_mark_sale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.on_sale := coalesce((select compare_price is not null from public.products where id = new.product_id), false);
  return new;
end;
$$;
revoke all on function public.sale_lines_mark_sale() from public, anon, authenticated;
drop trigger if exists sale_lines_mark_sale on public.sale_lines;
create trigger sale_lines_mark_sale before insert on public.sale_lines for each row execute function public.sale_lines_mark_sale();

-- An order saves its cost (as before) and the part that can earn points: goods that were not on sale. Never the delivery fee.
create or replace function public.orders_set_cost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(sum(coalesce(c.unit_cost, 0) * (l.value ->> 'quantity')::integer), 0),
         coalesce(sum((l.value ->> 'unitPrice')::integer * (l.value ->> 'quantity')::integer) filter (where p.compare_price is null), 0)
  into new.cost, new.points_base
  from jsonb_array_elements(new.lines) l
  left join public.product_costs c on c.product_id = (l.value ->> 'productId')::uuid
  left join public.products p on p.id = (l.value ->> 'productId')::uuid;
  return new;
end;
$$;

-- 3. Small helpers. Internal only: nothing outside the database can call them.
create or replace function public.loyalty_customer_for(p_phone text, p_name text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_id uuid;
begin
  if v_phone is null then return null; end if;
  insert into public.loyalty_customers (phone, name, created_by) values (v_phone, left(btrim(coalesce(p_name, '')), 120), auth.uid())
  on conflict (phone) do update set name = case when public.loyalty_customers.name = '' then excluded.name else public.loyalty_customers.name end
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.loyalty_balance(p_customer uuid, p_channel text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(remaining), 0)::integer from public.loyalty_entries
  where customer_id = p_customer and channel = p_channel and remaining > 0 and expires_at > now()
$$;

-- How many points this bill may use: none below 1,000 points, otherwise up to 20% of the bill.
create or replace function public.loyalty_max_use(p_bill integer, p_balance integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when p_balance < 1000 then 0 else least(p_balance, floor(greatest(p_bill, 0) * 0.2)::integer) end
$$;

-- Adds a batch of points that lasts 12 months.
create or replace function public.loyalty_give(p_customer uuid, p_channel text, p_kind text, p_points integer, p_sale uuid, p_order uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_points <= 0 then return; end if;
  insert into public.loyalty_entries (customer_id, channel, kind, points, remaining, expires_at, sale_id, order_id, note, created_by)
  values (p_customer, p_channel, p_kind, p_points, p_points, now() + interval '12 months', p_sale, p_order, left(coalesce(p_note, ''), 300), auth.uid());
end;
$$;

-- Takes points from the oldest live batches first and writes one history row. Refuses if there aren't enough.
create or replace function public.loyalty_take(p_customer uuid, p_channel text, p_kind text, p_points integer, p_sale uuid, p_order uuid, p_note text, p_partial boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_left integer := p_points;
  lot record;
  v_use integer;
begin
  if p_points <= 0 then return 0; end if;
  for lot in select id, remaining from public.loyalty_entries
    where customer_id = p_customer and channel = p_channel and remaining > 0 and expires_at > now()
    order by (sale_id is not distinct from p_sale and order_id is not distinct from p_order and kind = 'earn') desc, expires_at, created_at
    for update
  loop
    exit when v_left <= 0;
    v_use := least(lot.remaining, v_left);
    update public.loyalty_entries set remaining = remaining - v_use where id = lot.id;
    v_left := v_left - v_use;
  end loop;
  if v_left > 0 and not p_partial then raise exception 'points_balance'; end if;
  if p_points - v_left > 0 then
    insert into public.loyalty_entries (customer_id, channel, kind, points, sale_id, order_id, note, created_by)
    values (p_customer, p_channel, p_kind, -(p_points - v_left), p_sale, p_order, left(coalesce(p_note, ''), 300), auth.uid());
  end if;
  return p_points - v_left;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['loyalty_customer_for(text, text)', 'loyalty_balance(uuid, text)', 'loyalty_max_use(integer, integer)',
    'loyalty_give(uuid, text, text, integer, uuid, uuid, text)', 'loyalty_take(uuid, text, text, integer, uuid, uuid, text, boolean)', 'orders_set_cost()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

-- 4. Sales and orders show their points.
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
    'date', to_char(s.created_at at time zone 'Asia/Karachi', 'DD Mon YYYY'),
    'lines', coalesce((select jsonb_agg(jsonb_build_object('itemId', l.product_id, 'name', l.name, 'price', l.unit_price, 'quantity', l.quantity) order by l.id) from public.sale_lines l where l.sale_id = s.id), '[]'::jsonb),
    'listTotal', s.list_total,
    'total', s.total,
    'pay', s.pay,
    'given', s.given,
    'voided', s.voided_at is not null,
    'pointsUsed', s.points_used,
    'pointsEarned', s.points_earned,
    'customer', (select jsonb_build_object('phone', c.phone, 'name', c.name) from public.loyalty_customers c where c.id = s.customer_id)
  )
$$;

create or replace function public.order_json(o public.orders)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'number', o.number,
    'createdAt', o.created_at,
    'status', o.status,
    'customer', jsonb_build_object('name', o.customer_name, 'phone', o.customer_phone, 'email', o.customer_email),
    'delivery', jsonb_build_object('method', o.delivery_method, 'address', o.address, 'city', o.city, 'notes', o.notes),
    'payment', o.payment,
    'lines', o.lines,
    'subtotal', o.subtotal,
    'deliveryFee', o.delivery_fee,
    'pointsUsed', o.points_used,
    'pointsEarned', o.points_earned,
    'total', o.total
  )
$$;
revoke all on function public.order_json(public.orders) from public, anon, authenticated;

-- Order tracking also shows the customer's online points balance (only when the order number and mobile both match).
create or replace function public.find_order(p_number text, p_phone text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_order public.orders;
  v_customer uuid;
begin
  select * into v_order from public.orders
  where number = upper(btrim(coalesce(p_number, ''))) and customer_phone = public.normalize_phone(p_phone);
  if not found then return null; end if;
  select id into v_customer from public.loyalty_customers where phone = v_order.customer_phone;
  return public.order_json(v_order) || jsonb_build_object('pointsBalance', case when v_customer is null then 0 else public.loyalty_balance(v_customer, 'online') end);
end;
$$;

-- 5. The counter. Looks up a customer by mobile while a sale is being rung up.
create or replace function public.loyalty_lookup(p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  c public.loyalty_customers;
begin
  perform public.require_admin();
  if v_phone is null then raise exception 'invalid_phone'; end if;
  select * into c from public.loyalty_customers where phone = v_phone;
  if not found then return jsonb_build_object('phone', v_phone, 'found', false, 'name', '', 'shop', 0, 'online', 0); end if;
  return jsonb_build_object('phone', v_phone, 'found', true, 'name', c.name, 'shop', public.loyalty_balance(c.id, 'shop'), 'online', public.loyalty_balance(c.id, 'online'));
end;
$$;

-- Rings up a sale (counter_sell does the stock and money), then links the customer, uses points and adds points.
-- draft: the counter_sell draft plus { phone, name, points }. Anything wrong undoes the whole sale.
create or replace function public.counter_sell_points(draft jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone_text text := btrim(coalesce(draft ->> 'phone', ''));
  v_phone text := public.normalize_phone(v_phone_text);
  v_points integer;
  v_customer uuid;
  v_sale public.sales;
  v_balance integer;
  v_base integer;
  v_earn integer := 0;
  v_received_empty boolean := coalesce(draft ->> 'received', '') = '';
  v_sold jsonb;
begin
  perform public.require_admin();
  if v_phone_text <> '' and v_phone is null then raise exception 'invalid_phone'; end if;
  if coalesce(draft ->> 'points', '0') !~ '^[0-9]{1,7}$' then raise exception 'invalid_points'; end if;
  v_points := coalesce(nullif(draft ->> 'points', ''), '0')::integer;
  if v_points > 0 and v_phone is null then raise exception 'points_need_phone'; end if;

  -- Called once into a variable: inside a WHERE clause the database could run it once per row.
  v_sold := public.counter_sell(draft - 'phone' - 'name' - 'points');
  select * into v_sale from public.sales where id = (v_sold ->> 'id')::uuid for update;
  if v_phone is null then return public.sale_json(v_sale); end if;

  v_customer := public.loyalty_customer_for(v_phone, draft ->> 'name');
  update public.loyalty_customers set shop_since = coalesce(shop_since, now()) where id = v_customer;

  if v_points > 0 then
    v_balance := public.loyalty_balance(v_customer, 'shop');
    if v_balance < 1000 then raise exception 'points_minimum'; end if;
    if v_points > v_balance then raise exception 'points_balance'; end if;
    if v_points > public.loyalty_max_use(v_sale.list_total, v_balance) then raise exception 'points_limit'; end if;
    perform public.loyalty_take(v_customer, 'shop', 'redeem', v_points, v_sale.id, null, 'Sale ' || v_sale.number);
    -- With no amount typed, the customer pays the bill less the points.
    if v_received_empty then v_sale.total := v_sale.list_total - v_points; end if;
  end if;

  -- Points on what was paid for full-price items. A discounted bill earns nothing.
  if v_sale.total + v_points >= v_sale.list_total then
    v_base := coalesce((select sum(unit_price * quantity) from public.sale_lines where sale_id = v_sale.id and not on_sale), 0);
    v_earn := floor(greatest(v_base - v_points, 0) / 100.0)::integer;
    perform public.loyalty_give(v_customer, 'shop', 'earn', v_earn, v_sale.id, null, 'Sale ' || v_sale.number);
  end if;

  update public.sales set customer_id = v_customer, points_used = v_points, points_earned = v_earn, total = v_sale.total
  where id = v_sale.id returning * into v_sale;
  return public.sale_json(v_sale) || jsonb_build_object('pointsBalance', public.loyalty_balance(v_customer, 'shop'));
end;
$$;

-- A voided sale takes back the points it earned and gives back the points it used.
create or replace function public.sales_loyalty_void()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.voided_at is null and new.voided_at is not null and new.customer_id is not null then
    perform public.loyalty_take(new.customer_id, 'shop', 'reverse', new.points_earned, new.id, null, 'Sale ' || new.number || ' voided', true);
    perform public.loyalty_give(new.customer_id, 'shop', 'reverse', new.points_used, new.id, null, 'Points returned: sale ' || new.number || ' voided');
  end if;
  return new;
end;
$$;
revoke all on function public.sales_loyalty_void() from public, anon, authenticated;
drop trigger if exists sales_loyalty_void on public.sales;
create trigger sales_loyalty_void after update of voided_at on public.sales for each row execute function public.sales_loyalty_void();

-- 6. Online orders. Points are added when an order becomes delivered and taken back if it stops being delivered.
--    A cancelled order gets its used points back.
create or replace function public.orders_loyalty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid;
  v_earn integer;
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    v_customer := coalesce(new.customer_id, public.loyalty_customer_for(new.customer_phone, new.customer_name));
    update public.loyalty_customers set online_since = coalesce(online_since, now()) where id = v_customer;
    new.customer_id := v_customer;
    v_earn := floor(greatest(coalesce(new.points_base, 0) - new.points_used, 0) / 100.0)::integer;
    perform public.loyalty_give(v_customer, 'online', 'earn', v_earn, null, new.id, 'Order ' || new.number);
    new.points_earned := v_earn;
  elsif old.status = 'delivered' and new.status <> 'delivered' and old.points_earned > 0 then
    perform public.loyalty_take(new.customer_id, 'online', 'reverse', old.points_earned, null, new.id, 'Order ' || new.number || ' no longer delivered', true);
    new.points_earned := 0;
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' and new.points_used > 0 then
    perform public.loyalty_give(new.customer_id, 'online', 'reverse', new.points_used, null, new.id, 'Points returned: order ' || new.number || ' cancelled');
    new.points_used := 0;
    new.total := new.subtotal + new.delivery_fee;
  end if;
  return new;
end;
$$;
revoke all on function public.orders_loyalty() from public, anon, authenticated;
drop trigger if exists orders_loyalty on public.orders;
create trigger orders_loyalty before update of status on public.orders for each row execute function public.orders_loyalty();

-- Staff use points on an online order while confirming it on WhatsApp. Changing the amount gives back the old one first.
create or replace function public.order_apply_points(p_order uuid, p_points integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  v_customer uuid;
  v_balance integer;
begin
  perform public.require_admin();
  if p_points is null or p_points < 0 or p_points > 10000000 then raise exception 'invalid_points'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found'; end if;
  if o.status not in ('placed', 'confirmed') then raise exception 'order_locked'; end if;
  if p_points = o.points_used then
    return jsonb_build_object('pointsUsed', o.points_used, 'total', o.total, 'balance', coalesce(public.loyalty_balance(o.customer_id, 'online'), 0));
  end if;
  v_customer := coalesce(o.customer_id, public.loyalty_customer_for(o.customer_phone, o.customer_name));
  update public.loyalty_customers set online_since = coalesce(online_since, now()) where id = v_customer;
  perform public.loyalty_give(v_customer, 'online', 'reverse', o.points_used, null, o.id, 'Points changed on order ' || o.number);
  if p_points > 0 then
    v_balance := public.loyalty_balance(v_customer, 'online');
    if v_balance < 1000 then raise exception 'points_minimum'; end if;
    if p_points > v_balance then raise exception 'points_balance'; end if;
    if p_points > public.loyalty_max_use(o.subtotal, v_balance) then raise exception 'points_limit'; end if;
    perform public.loyalty_take(v_customer, 'online', 'redeem', p_points, null, o.id, 'Order ' || o.number);
  end if;
  update public.orders set points_used = p_points, total = subtotal + delivery_fee - p_points, customer_id = v_customer where id = o.id returning * into o;
  return jsonb_build_object('pointsUsed', o.points_used, 'total', o.total, 'balance', public.loyalty_balance(v_customer, 'online'));
end;
$$;

-- 7. The admin Customers page.
create or replace function public.loyalty_list(p_channel text, p_search text default '', p_offset integer default 0, p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := btrim(coalesce(p_search, ''));
  v_digits text := regexp_replace(coalesce(p_search, ''), '[^0-9]', '', 'g');
begin
  perform public.require_admin();
  if p_channel not in ('shop', 'online') then raise exception 'invalid_channel'; end if;
  if v_digits ~ '^(92|0092)' then v_digits := '0' || regexp_replace(v_digits, '^(0092|92)', ''); end if;
  return (
    with members as (
      select c.id, c.phone, c.name, case when p_channel = 'shop' then c.shop_since else c.online_since end as since
      from public.loyalty_customers c
      where (case when p_channel = 'shop' then c.shop_since else c.online_since end) is not null
        and (v_search = '' or c.name ilike '%' || replace(replace(v_search, '%', ''), '_', '') || '%' or (v_digits <> '' and c.phone like '%' || v_digits || '%'))
    ),
    figures as (
      select m.id, m.phone, m.name, m.since,
        coalesce(sum(e.remaining) filter (where e.remaining > 0 and e.expires_at > now()), 0) as balance,
        coalesce(sum(e.remaining) filter (where e.remaining > 0 and e.expires_at > now() and e.expires_at < now() + interval '30 days'), 0) as expiring,
        coalesce(sum(e.points) filter (where e.kind = 'earn'), 0) as earned,
        coalesce(-sum(e.points) filter (where e.kind = 'redeem'), 0) as used,
        greatest(m.since, max(e.created_at)) as last
      from members m
      left join public.loyalty_entries e on e.customer_id = m.id and e.channel = p_channel
      group by m.id, m.phone, m.name, m.since
    )
    select jsonb_build_object(
      'total', (select count(*) from figures),
      'pointsOut', (select coalesce(sum(balance), 0) from figures),
      'items', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'phone', f.phone, 'name', f.name, 'balance', f.balance, 'expiring', f.expiring,
          'earned', f.earned, 'used', f.used, 'last', to_char(f.last at time zone 'Asia/Karachi', 'DD Mon YYYY')) order by f.last desc)
        from (select * from figures order by last desc offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 100)) f), '[]'::jsonb))
  );
end;
$$;

create or replace function public.loyalty_customer(p_customer uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.loyalty_customers;
begin
  perform public.require_admin();
  select * into c from public.loyalty_customers where id = p_customer;
  if not found then raise exception 'not_found'; end if;
  return jsonb_build_object(
    'id', c.id, 'phone', c.phone, 'name', c.name,
    'shop', jsonb_build_object('member', c.shop_since is not null, 'balance', public.loyalty_balance(c.id, 'shop')),
    'online', jsonb_build_object('member', c.online_since is not null, 'balance', public.loyalty_balance(c.id, 'online')),
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
        'id', e.id, 'channel', e.channel, 'kind', e.kind, 'points', e.points, 'remaining', e.remaining, 'note', e.note,
        'date', to_char(e.created_at at time zone 'Asia/Karachi', 'DD Mon YYYY, HH24:MI'),
        'expires', to_char(e.expires_at at time zone 'Asia/Karachi', 'DD Mon YYYY'),
        'expired', e.expires_at is not null and e.expires_at <= now() and e.remaining > 0) order by e.created_at desc)
      from (select * from public.loyalty_entries where customer_id = c.id order by created_at desc limit 300) e), '[]'::jsonb)
  );
end;
$$;

-- Admin only, with a reason every time. Plus adds a new 12-month batch; minus takes from the oldest batches.
create or replace function public.loyalty_adjust(p_customer uuid, p_channel text, p_points integer, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.require_admin();
  if p_channel not in ('shop', 'online') then raise exception 'invalid_channel'; end if;
  if p_points is null or p_points = 0 or abs(p_points) > 1000000 then raise exception 'invalid_points'; end if;
  if char_length(v_reason) < 3 then raise exception 'reason_needed'; end if;
  if not exists (select 1 from public.loyalty_customers where id = p_customer) then raise exception 'not_found'; end if;
  if p_points > 0 then
    perform public.loyalty_give(p_customer, p_channel, 'adjust', p_points, null, null, v_reason);
  else
    perform public.loyalty_take(p_customer, p_channel, 'adjust', -p_points, null, null, v_reason);
  end if;
  if p_channel = 'shop' then update public.loyalty_customers set shop_since = coalesce(shop_since, now()) where id = p_customer;
  else update public.loyalty_customers set online_since = coalesce(online_since, now()) where id = p_customer; end if;
  return public.loyalty_customer(p_customer);
end;
$$;

create or replace function public.loyalty_rename(p_customer uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.loyalty_customers set name = left(btrim(coalesce(p_name, '')), 120) where id = p_customer;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['loyalty_lookup(text)', 'counter_sell_points(jsonb)', 'order_apply_points(uuid, integer)', 'loyalty_list(text, text, integer, integer)',
    'loyalty_customer(uuid)', 'loyalty_adjust(uuid, text, integer, text)', 'loyalty_rename(uuid, text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- 8. Monthly closing: points used come off sales (shop: the cash received is already lower; online: subtracted here),
--    are not counted as discounts, and a points summary is added. Everything else as in 20261121100000.
create or replace function public.month_figures(p_month date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  m0 date := date_trunc('month', p_month)::date;
  m1 date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_from timestamptz := public.day_start(date_trunc('month', p_month)::date);
  v_to timestamptz := public.day_start((date_trunc('month', p_month) + interval '1 month')::date);
  rec public.month_closings;
  v_prev jsonb;
  hw_sell numeric; hw_cost numeric; bt_sell numeric; bt_cost numeric; co_sell numeric; co_cost numeric;
  refills numeric; bottles_opened numeric; taxes numeric; direct numeric; writeoffs numeric;
  adj_sell numeric; adj_cost numeric;
  shop_sales numeric; shop_profit numeric;
  on_goods numeric; on_fees numeric; on_cost numeric; on_count integer; on_waiting numeric; on_waiting_count integer;
  on_sales numeric; on_profit numeric;
  match_amt numeric;
  pts_shop numeric; pts_online numeric; earned_shop numeric; earned_online numeric;
  sales_total numeric; profit numeric; charity_pct numeric; charity numeric; shop_expense numeric; net numeric;
  old_amount numeric; paid_restock numeric; restock_amount numeric; diff numeric;
  stock_value numeric; assets numeric; match_total numeric;
  disc numeric; disc_count integer; extra numeric; extra_count integer; disc_prev numeric; extra_prev numeric;
  rent constant integer := 15000; electric constant integer := 10000; pay constant integer := 5000;
begin
  select * into rec from public.month_closings where month = m0;
  if rec.locked_at is not null and rec.summary is not null then return rec.summary; end if;

  -- Shop counter: each sale line's real selling amount is its share of what the shop received for the whole sale.
  with lines as (
    select coalesce(p.category, 'device') as category,
           l.unit_price * l.quantity * (case when s.list_total > 0 then s.total::numeric / s.list_total else 1 end) as sell,
           l.unit_cost * l.quantity as cost
    from public.sale_lines l
    join public.sales s on s.id = l.sale_id
    left join public.products p on p.id = l.product_id
    where s.voided_at is null and s.created_at >= v_from and s.created_at < v_to
  )
  select coalesce(sum(sell) filter (where category in ('device', 'disposable')), 0), coalesce(sum(cost) filter (where category in ('device', 'disposable')), 0),
         coalesce(sum(sell) filter (where category = 'bottle'), 0), coalesce(sum(cost) filter (where category = 'bottle'), 0),
         coalesce(sum(sell) filter (where category = 'coil'), 0), coalesce(sum(cost) filter (where category = 'coil'), 0)
  into hw_sell, hw_cost, bt_sell, bt_cost, co_sell, co_cost
  from lines;

  refills := coalesce((select sum(amount) from public.refill_entries where undone_at is null and created_at >= v_from and created_at < v_to), 0);
  bottles_opened := coalesce((select sum(cost) from public.refill_bottles where opened_at >= v_from and opened_at < v_to), 0);
  taxes := coalesce((select sum(amount) from public.expenses where removed_at is null and day >= m0 and day < m1 and kind in ('Shipping', 'CMC Tax', 'Elite Tax')), 0);
  direct := coalesce((select sum(amount) from public.expenses where removed_at is null and day >= m0 and day < m1 and kind not in ('Shipping', 'CMC Tax', 'Elite Tax')), 0);
  writeoffs := coalesce((select sum(-change * unit_cost) from public.stock_moves where reason = 'writeoff' and created_at >= v_from and created_at < v_to), 0);
  paid_restock := coalesce((select sum(change * unit_cost) from public.stock_moves where reason = 'restock' and created_at >= v_from and created_at < v_to), 0);

  select coalesce(sum(points_used), 0), coalesce(sum(points_earned), 0) into pts_shop, earned_shop
  from public.sales where voided_at is null and created_at >= v_from and created_at < v_to;

  adj_sell := refills;
  adj_cost := taxes + bottles_opened;
  shop_sales := hw_sell + adj_sell + bt_sell + co_sell;
  shop_profit := (hw_sell + adj_sell - hw_cost - adj_cost) + (bt_sell - bt_cost) + (co_sell - co_cost);

  -- Online: orders delivered this month. Goods + the delivery fee the customer paid, less what the goods cost.
  select coalesce(sum(subtotal), 0), coalesce(sum(delivery_fee), 0), coalesce(sum(cost), 0), count(*), coalesce(sum(points_used), 0), coalesce(sum(points_earned), 0)
  into on_goods, on_fees, on_cost, on_count, pts_online, earned_online
  from public.orders where status = 'delivered' and delivered_at >= v_from and delivered_at < v_to;
  select coalesce(sum(total), 0), count(*) into on_waiting, on_waiting_count
  from public.orders where status in ('placed', 'confirmed', 'shipped') and created_at >= v_from and created_at < v_to;
  on_sales := on_goods + on_fees - pts_online;
  on_profit := on_sales - on_cost;

  sales_total := shop_sales + on_sales;                                                       -- M2
  profit := shop_profit + on_profit;                                                          -- N2
  charity_pct := coalesce(rec.charity_percent,
    (select charity_percent from public.month_closings where month < m0 and charity_percent is not null order by month desc limit 1), 1.5);
  charity := round(profit * charity_pct / 100, 2);                                            -- S2
  shop_expense := direct + writeoffs + coalesce(rec.withdrawal_profit, 0);                    -- L10
  net := profit - rent - electric - pay - shop_expense - charity;                             -- O3

  if rec.old_amount is not null or m0 <= coalesce(public.first_month(), m0) then
    old_amount := coalesce(rec.old_amount, 0);
  else
    v_prev := public.month_figures((m0 - interval '1 month')::date);
    old_amount := coalesce((v_prev ->> 'restockAmount')::numeric, 0);
  end if;                                                                                     -- L6

  restock_amount := sales_total - profit + old_amount - paid_restock - coalesce(rec.investment_return, 0); -- M7
  diff := sales_total - (paid_restock + coalesce(rec.investment_return, 0) + coalesce(rec.cash, 0) + coalesce(rec.bank, 0) - old_amount
          + coalesce(rec.rent_paid, 0) + coalesce(rec.electric_paid, 0) + shop_expense) + coalesce(rec.personal_investment, 0); -- M10

  -- Match Amount stays the same from month to month until the owner types a new one (owner, 2026-11-21).
  match_amt := coalesce(rec.match_amount,
    (select match_amount from public.month_closings where month < m0 and match_amount is not null order by month desc limit 1));

  stock_value := coalesce((select sum(p.stock * c.unit_cost) from public.products p join public.product_costs c on c.product_id = p.id where p.stock > 0), 0);
  assets := coalesce((select sum(value) from public.fixed_assets where removed_at is null), 0);
  match_total := stock_value + assets + restock_amount;

  select coalesce(sum(list_total - points_used - total) filter (where total + points_used < list_total), 0), count(*) filter (where total + points_used < list_total),
         coalesce(sum(total + points_used - list_total) filter (where total + points_used > list_total), 0), count(*) filter (where total + points_used > list_total)
  into disc, disc_count, extra, extra_count
  from public.sales where voided_at is null and created_at >= v_from and created_at < v_to;
  select coalesce(sum(list_total - points_used - total) filter (where total + points_used < list_total), 0), coalesce(sum(total + points_used - list_total) filter (where total + points_used > list_total), 0)
  into disc_prev, extra_prev
  from public.sales where voided_at is null and created_at >= public.day_start((m0 - interval '1 month')::date) and created_at < v_from;

  return jsonb_build_object(
    'month', m0,
    'inputs', jsonb_build_object(
      'oldAmount', rec.old_amount, 'personalInvestment', coalesce(rec.personal_investment, 0), 'investmentReturn', coalesce(rec.investment_return, 0),
      'withdrawalProfit', coalesce(rec.withdrawal_profit, 0), 'cash', coalesce(rec.cash, 0), 'bank', coalesce(rec.bank, 0),
      'rentPaid', coalesce(rec.rent_paid, 0), 'electricPaid', coalesce(rec.electric_paid, 0), 'matchAmount', match_amt,
      'charityPercent', charity_pct),
    'firstMonth', m0 <= coalesce(public.first_month(), m0),
    'sections', jsonb_build_object(
      'hardware', jsonb_build_object('sales', hw_sell + adj_sell, 'cost', hw_cost + adj_cost, 'profit', hw_sell + adj_sell - hw_cost - adj_cost),
      'cashAdjustment', jsonb_build_object('sales', adj_sell, 'cost', adj_cost, 'refills', refills, 'taxes', taxes, 'bottlesOpened', bottles_opened),
      'bottles', jsonb_build_object('sales', bt_sell, 'cost', bt_cost, 'profit', bt_sell - bt_cost),
      'coils', jsonb_build_object('sales', co_sell, 'cost', co_cost, 'profit', co_sell - co_cost)),
    'shop', jsonb_build_object('sales', shop_sales, 'cost', shop_sales - shop_profit, 'profit', shop_profit),
    'online', jsonb_build_object('sales', on_sales, 'goods', on_goods, 'deliveryFees', on_fees, 'cost', on_cost, 'profit', on_profit,
      'count', on_count, 'waiting', on_waiting, 'waitingCount', on_waiting_count, 'pointsUsed', pts_online),
    'points', jsonb_build_object('shopUsed', pts_shop, 'onlineUsed', pts_online, 'shopEarned', earned_shop, 'onlineEarned', earned_online,
      'shopOut', coalesce((select sum(remaining) from public.loyalty_entries where channel = 'shop' and remaining > 0 and expires_at > now()), 0),
      'onlineOut', coalesce((select sum(remaining) from public.loyalty_entries where channel = 'online' and remaining > 0 and expires_at > now()), 0)),
    'salesTotal', sales_total, 'profit', profit,
    'rent', rent, 'electric', electric, 'pay', pay, 'charity', charity, 'charityPercent', charity_pct,
    'directExpenses', direct, 'writeOffs', writeoffs, 'shopExpense', shop_expense, 'netProfit', net,
    'oldAmount', old_amount, 'paidRestock', paid_restock, 'restockAmount', restock_amount, 'diff', diff,
    'stockValue', stock_value, 'assets', assets, 'matchTotal', match_total,
    'matchDiff', case when match_amt is null then null else match_total - match_amt end,
    'discounts', jsonb_build_object('total', disc, 'count', disc_count, 'lastMonth', disc_prev),
    'extra', jsonb_build_object('total', extra, 'count', extra_count, 'lastMonth', extra_prev),
    'adjustedSales', coalesce((select jsonb_agg(jsonb_build_object('number', s.number, 'date', to_char(s.created_at at time zone 'Asia/Karachi', 'DD Mon'), 'listTotal', s.list_total - s.points_used, 'total', s.total,
        'items', (select string_agg(l.quantity || ' × ' || l.name, ', ' order by l.id) from public.sale_lines l where l.sale_id = s.id)) order by s.number desc)
      from (select * from public.sales where voided_at is null and created_at >= v_from and created_at < v_to and total + points_used <> list_total order by number desc limit 300) s), '[]'::jsonb),
    'closed', rec.closed_at is not null,
    'closedOn', to_char(rec.closed_at at time zone 'Asia/Karachi', 'DD Mon YYYY'),
    'locked', rec.locked_at is not null
  );
end;
$$;

revoke all on function public.month_figures(date) from public, anon, authenticated;
