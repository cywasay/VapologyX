-- Counter discounts and extra charged, locking days, sale prices, fixed assets and the monthly closing.
-- The month figures follow the client's Excel "Daily CLosing" sheet formula by formula (see HANDOFF.md section 5).

-- 1. Sales keep the bill at shop prices (list_total) next to what the shop actually received (total).
--    total below list_total = discount, above = extra charged.
alter table public.sales add column if not exists list_total integer;
update public.sales set list_total = total where list_total is null;
alter table public.sales alter column list_total set not null;
alter table public.sales drop constraint if exists sales_list_total_check;
alter table public.sales add constraint sales_list_total_check check (list_total >= 0);

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
    'voided', s.voided_at is not null
  )
$$;

-- 2. Days: closing no longer freezes the day. Only a lock does, and a lock is forever.
alter table public.counter_days add column if not exists locked_at timestamptz;
alter table public.counter_days add column if not exists locked_by uuid;

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
  if v_day.locked_at is not null then raise exception 'day_locked'; end if;
  return v_day;
end;
$$;

create or replace function public.counter_lock_day()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day public.counter_days;
begin
  perform public.require_admin();
  v_day := public.open_day();
  if v_day.closed_at is null then raise exception 'close_first'; end if;
  update public.counter_days set locked_at = now(), locked_by = auth.uid() where day = v_day.day;
  return jsonb_build_object('locked', true);
end;
$$;

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
    'locked', v_day.locked_at is not null,
    'closing', case when v_day.closed_at is null then null else jsonb_build_object('counted', v_day.counted_cash, 'expected', v_day.expected_cash, 'difference', v_day.difference) end,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'code', coalesce(p.barcode, ''), 'name', p.name, 'shelf', p.category, 'type', p.type, 'price', p.price, 'wasPrice', p.compare_price, 'stock', p.stock) order by p.position) from public.products p where p.stock is not null), '[]'::jsonb),
    'sales', coalesce((select jsonb_agg(public.sale_json(s) order by s.number) from public.sales s where s.created_at >= v_from and s.created_at < v_to), '[]'::jsonb),
    'bottles', coalesce((select jsonb_agg(public.bottle_json(b) order by b.opened_at) from public.refill_bottles b where b.finished_at is null or b.finished_at >= public.day_start(d - 30)), '[]'::jsonb),
    'refillsToday', coalesce((select sum(e.amount) from public.refill_entries e where e.undone_at is null and e.created_at >= v_from and e.created_at < v_to), 0),
    'refillsAll', coalesce((select sum(e.amount) from public.refill_entries e where e.undone_at is null), 0),
    'cashOuts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'amount', c.amount, 'note', c.note) order by c.created_at) from public.cash_outs c where c.day = d and c.removed_at is null), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'amount', x.amount, 'note', x.note, 'fromDrawer', x.from_drawer) order by x.created_at) from public.expenses x where x.day = d and x.removed_at is null), '[]'::jsonb)
  );
end;
$$;

-- 3. Sale prices. While a product is on sale, price is the sale price and compare_price the normal one,
--    so the shop, cart, orders and counter all use the sale price without any other change.
alter table public.products add column if not exists compare_price integer;
alter table public.products drop constraint if exists products_compare_price_check;
alter table public.products add constraint products_compare_price_check check (compare_price is null or compare_price > price);

-- Rings up a sale. Prices come from the products table, never from the screen.
-- Draft: { pay, received, lines: [{ productId, quantity }] }. received = what the shop kept; empty means the full bill.
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
  v_received integer;
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
  v_received := case when coalesce(draft ->> 'received', '') ~ '^[0-9]{1,9}$' then (draft ->> 'received')::integer else null end;

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

  insert into public.sales (created_by, pay, list_total, total, given, cost)
  values (auth.uid(), v_pay, v_total, coalesce(v_received, v_total), null, v_cost_total)
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

-- True when the amount received would be less than what the goods cost. Used only to warn; the sale is still allowed.
-- The cost itself is never sent to the counter screen.
create or replace function public.counter_below_cost(draft jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost numeric;
begin
  perform public.require_admin();
  select coalesce(sum(coalesce(c.unit_cost, 0) * (x.value ->> 'quantity')::integer), 0) into v_cost
  from jsonb_array_elements(draft -> 'lines') x
  left join public.product_costs c on c.product_id = (x.value ->> 'productId')::uuid;
  return coalesce(draft ->> 'received', '') ~ '^[0-9]{1,9}$' and (draft ->> 'received')::integer < v_cost;
end;
$$;

-- 4. Fixed assets (furniture, panaflex…). They keep the value typed in.
create table if not exists public.fixed_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  value integer not null check (value >= 0),
  created_at timestamptz not null default now(),
  created_by uuid,
  removed_at timestamptz
);
alter table public.fixed_assets enable row level security;
revoke all on table public.fixed_assets from anon, authenticated;
grant select on table public.fixed_assets to authenticated;
grant select, insert, update, delete on table public.fixed_assets to service_role;
drop policy if exists "Admins read fixed_assets" on public.fixed_assets;
create policy "Admins read fixed_assets" on public.fixed_assets for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.asset_add(p_name text, p_value integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  if p_value is null or p_value < 0 or p_value > 1000000000 then raise exception 'invalid_value'; end if;
  insert into public.fixed_assets (name, value, created_by) values (btrim(coalesce(p_name, '')), p_value, auth.uid());
end;
$$;

create or replace function public.asset_remove(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.fixed_assets set removed_at = now() where id = p_id and removed_at is null;
end;
$$;

-- 5. Monthly closing. One row per month holds what is typed in; everything else is worked out from the records.
create table if not exists public.month_closings (
  month date primary key check (extract(day from month) = 1),
  old_amount numeric(14, 2),               -- typed only for the very first month; later months carry it forward
  personal_investment integer not null default 0,
  investment_return integer not null default 0,   -- money taken out of the inventory money (L15)
  withdrawal_profit integer not null default 0,   -- money taken out of profit (added to Shop Expense)
  cash integer not null default 0,
  bank integer not null default 0,
  rent_paid integer not null default 0,
  electric_paid integer not null default 0,
  match_amount numeric(14, 2),
  closed_at timestamptz,
  closed_by uuid,
  locked_at timestamptz,
  locked_by uuid,
  summary jsonb
);
alter table public.month_closings enable row level security;
revoke all on table public.month_closings from anon, authenticated;
grant select on table public.month_closings to authenticated;
grant select, insert, update, delete on table public.month_closings to service_role;
drop policy if exists "Admins read month_closings" on public.month_closings;
create policy "Admins read month_closings" on public.month_closings for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The first month anything was recorded. Months before it have nothing to carry forward.
create or replace function public.first_month()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', least(
    (select min(created_at at time zone 'Asia/Karachi') from public.sales),
    (select min(opened_at at time zone 'Asia/Karachi') from public.refill_bottles),
    (select min(day)::timestamp from public.expenses),
    (select min(month)::timestamp from public.month_closings)
  ))::date
$$;

-- All the month's figures, laid out like the Excel sheet.
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
  sales_total numeric; profit numeric; charity numeric; shop_expense numeric; net numeric;
  old_amount numeric; paid_restock numeric; restock_amount numeric; diff numeric;
  stock_value numeric; assets numeric; match_total numeric;
  disc numeric; disc_count integer; extra numeric; extra_count integer; disc_prev numeric; extra_prev numeric;
  online numeric;
  rent constant integer := 15000; electric constant integer := 10000; pay constant integer := 5000;
begin
  select * into rec from public.month_closings where month = m0;
  if rec.locked_at is not null and rec.summary is not null then return rec.summary; end if;

  -- Each sale line's real selling amount: its share of what the shop actually received for the whole sale.
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

  -- "For Cash Adjustment" (Hardware row): refill money in, taxes and opened refill bottles out.
  adj_sell := refills;
  adj_cost := taxes + bottles_opened;

  sales_total := hw_sell + adj_sell + bt_sell + co_sell;                                     -- M2
  profit := (hw_sell + adj_sell - hw_cost - adj_cost) + (bt_sell - bt_cost) + (co_sell - co_cost); -- N2
  charity := round(profit * 0.015, 2);                                                        -- S2
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

  stock_value := coalesce((select sum(p.stock * c.unit_cost) from public.products p join public.product_costs c on c.product_id = p.id where p.stock > 0), 0);
  assets := coalesce((select sum(value) from public.fixed_assets where removed_at is null), 0);
  match_total := stock_value + assets + restock_amount;

  select coalesce(sum(list_total - total) filter (where total < list_total), 0), count(*) filter (where total < list_total),
         coalesce(sum(total - list_total) filter (where total > list_total), 0), count(*) filter (where total > list_total)
  into disc, disc_count, extra, extra_count
  from public.sales where voided_at is null and created_at >= v_from and created_at < v_to;
  select coalesce(sum(list_total - total) filter (where total < list_total), 0), coalesce(sum(total - list_total) filter (where total > list_total), 0)
  into disc_prev, extra_prev
  from public.sales where voided_at is null and created_at >= public.day_start((m0 - interval '1 month')::date) and created_at < v_from;

  online := coalesce((select sum(total) from public.orders where status <> 'cancelled' and created_at >= v_from and created_at < v_to), 0);

  return jsonb_build_object(
    'month', m0,
    'inputs', jsonb_build_object(
      'oldAmount', rec.old_amount, 'personalInvestment', coalesce(rec.personal_investment, 0), 'investmentReturn', coalesce(rec.investment_return, 0),
      'withdrawalProfit', coalesce(rec.withdrawal_profit, 0), 'cash', coalesce(rec.cash, 0), 'bank', coalesce(rec.bank, 0),
      'rentPaid', coalesce(rec.rent_paid, 0), 'electricPaid', coalesce(rec.electric_paid, 0), 'matchAmount', rec.match_amount),
    'firstMonth', m0 <= coalesce(public.first_month(), m0),
    'sections', jsonb_build_object(
      'hardware', jsonb_build_object('sales', hw_sell + adj_sell, 'cost', hw_cost + adj_cost, 'profit', hw_sell + adj_sell - hw_cost - adj_cost),
      'cashAdjustment', jsonb_build_object('sales', adj_sell, 'cost', adj_cost, 'refills', refills, 'taxes', taxes, 'bottlesOpened', bottles_opened),
      'bottles', jsonb_build_object('sales', bt_sell, 'cost', bt_cost, 'profit', bt_sell - bt_cost),
      'coils', jsonb_build_object('sales', co_sell, 'cost', co_cost, 'profit', co_sell - co_cost)),
    'salesTotal', sales_total, 'profit', profit,
    'rent', rent, 'electric', electric, 'pay', pay, 'charity', charity,
    'directExpenses', direct, 'writeOffs', writeoffs, 'shopExpense', shop_expense, 'netProfit', net,
    'oldAmount', old_amount, 'paidRestock', paid_restock, 'restockAmount', restock_amount, 'diff', diff,
    'stockValue', stock_value, 'assets', assets, 'matchTotal', match_total,
    'matchDiff', case when rec.match_amount is null then null else match_total - rec.match_amount end,
    'discounts', jsonb_build_object('total', disc, 'count', disc_count, 'lastMonth', disc_prev),
    'extra', jsonb_build_object('total', extra, 'count', extra_count, 'lastMonth', extra_prev),
    'adjustedSales', coalesce((select jsonb_agg(jsonb_build_object('number', s.number, 'date', to_char(s.created_at at time zone 'Asia/Karachi', 'DD Mon'), 'listTotal', s.list_total, 'total', s.total,
        'items', (select string_agg(l.quantity || ' × ' || l.name, ', ' order by l.id) from public.sale_lines l where l.sale_id = s.id)) order by s.number desc)
      from (select * from public.sales where voided_at is null and created_at >= v_from and created_at < v_to and total <> list_total order by number desc limit 300) s), '[]'::jsonb),
    'onlineOrders', online,
    'closed', rec.closed_at is not null,
    'closedOn', to_char(rec.closed_at at time zone 'Asia/Karachi', 'DD Mon YYYY'),
    'locked', rec.locked_at is not null
  );
end;
$$;

create or replace function public.month_report(p_month date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  return public.month_figures(p_month);
end;
$$;

-- Saves what is typed in. Refused once the month is locked.
create or replace function public.month_save(p_month date, p_inputs jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m0 date := date_trunc('month', p_month)::date;
  rec public.month_closings;
  n text;
begin
  perform public.require_admin();
  insert into public.month_closings (month) values (m0) on conflict (month) do nothing;
  select * into rec from public.month_closings where month = m0 for update;
  if rec.locked_at is not null then raise exception 'month_locked'; end if;
  foreach n in array array['personalInvestment', 'investmentReturn', 'withdrawalProfit', 'cash', 'bank', 'rentPaid', 'electricPaid'] loop
    if coalesce(p_inputs ->> n, '0') !~ '^[0-9]{1,10}$' then raise exception 'invalid_input: %', n; end if;
  end loop;
  if coalesce(p_inputs ->> 'oldAmount', '') !~ '^(-?[0-9]{1,12}(\.[0-9]{1,2})?)?$' or coalesce(p_inputs ->> 'matchAmount', '') !~ '^([0-9]{1,12}(\.[0-9]{1,2})?)?$' then raise exception 'invalid_input'; end if;
  update public.month_closings set
    old_amount = nullif(p_inputs ->> 'oldAmount', '')::numeric,
    personal_investment = coalesce(p_inputs ->> 'personalInvestment', '0')::integer,
    investment_return = coalesce(p_inputs ->> 'investmentReturn', '0')::integer,
    withdrawal_profit = coalesce(p_inputs ->> 'withdrawalProfit', '0')::integer,
    cash = coalesce(p_inputs ->> 'cash', '0')::integer,
    bank = coalesce(p_inputs ->> 'bank', '0')::integer,
    rent_paid = coalesce(p_inputs ->> 'rentPaid', '0')::integer,
    electric_paid = coalesce(p_inputs ->> 'electricPaid', '0')::integer,
    match_amount = nullif(p_inputs ->> 'matchAmount', '')::numeric
  where month = m0;
  return public.month_figures(m0);
end;
$$;

-- Closing saves the figures as they are now. It can be done again after a fix. Locking is forever.
create or replace function public.month_close(p_month date, p_lock boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m0 date := date_trunc('month', p_month)::date;
  rec public.month_closings;
begin
  perform public.require_admin();
  insert into public.month_closings (month) values (m0) on conflict (month) do nothing;
  select * into rec from public.month_closings where month = m0 for update;
  if rec.locked_at is not null then raise exception 'month_locked'; end if;
  if p_lock and rec.closed_at is null then raise exception 'close_first'; end if;
  update public.month_closings set closed_at = coalesce(case when p_lock then closed_at end, now()), closed_by = auth.uid() where month = m0;
  if p_lock then
    update public.month_closings set summary = public.month_figures(m0) || jsonb_build_object('closed', true, 'locked', true), locked_at = now(), locked_by = auth.uid() where month = m0;
  else
    update public.month_closings set summary = public.month_figures(m0) where month = m0;
  end if;
  return public.month_figures(m0);
end;
$$;

-- Only signed-in admins can run these; the checks inside refuse everyone else as well.
do $$
declare f text;
begin
  foreach f in array array['counter_lock_day()', 'counter_below_cost(jsonb)', 'asset_add(text, integer)', 'asset_remove(uuid)', 'month_figures(date)', 'month_report(date)', 'month_save(date, jsonb)', 'month_close(date, boolean)', 'first_month()'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke execute on function public.month_figures(date) from authenticated;
