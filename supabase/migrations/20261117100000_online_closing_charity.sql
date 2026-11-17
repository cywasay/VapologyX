-- Owner's answers (2026-11-17):
--  * Online orders count in the month's sales and profit, shown apart from the shop counter.
--    An order counts in the month it was DELIVERED. The delivery fee the customer pays counts as online sales.
--  * Charity % can be changed per month on the closing page (starts at last month's %, first month 1.5%).

-- 1. What the goods of each order cost, saved when the order is placed (admin-only: order_json never shows it).
alter table public.orders add column if not exists cost numeric(14, 2);
alter table public.orders add column if not exists delivered_at timestamptz;

create or replace function public.orders_set_cost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.cost := coalesce((
    select sum(coalesce(c.unit_cost, 0) * (l.value ->> 'quantity')::integer)
    from jsonb_array_elements(new.lines) l
    left join public.product_costs c on c.product_id = (l.value ->> 'productId')::uuid
  ), 0);
  return new;
end;
$$;
revoke all on function public.orders_set_cost() from public, anon, authenticated;

drop trigger if exists orders_set_cost on public.orders;
create trigger orders_set_cost
before insert on public.orders
for each row execute function public.orders_set_cost();

-- Orders placed before this had no cost saved: use today's cost (the best there is).
update public.orders o set cost = coalesce((
  select sum(coalesce(c.unit_cost, 0) * (l.value ->> 'quantity')::integer)
  from jsonb_array_elements(o.lines) l
  left join public.product_costs c on c.product_id = (l.value ->> 'productId')::uuid
), 0)
where o.cost is null;

-- 2. The day an order was delivered. Moving it away from "delivered" clears it again.
create or replace function public.orders_set_delivered()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at := now();
  elsif new.status <> 'delivered' then
    new.delivered_at := null;
  end if;
  return new;
end;
$$;
revoke all on function public.orders_set_delivered() from public, anon, authenticated;

drop trigger if exists orders_set_delivered on public.orders;
create trigger orders_set_delivered
before update of status on public.orders
for each row execute function public.orders_set_delivered();

update public.orders set delivered_at = updated_at where status = 'delivered' and delivered_at is null;

-- 3. Charity % per month. Empty = last month's %, or 1.5% if no month has one.
alter table public.month_closings add column if not exists charity_percent numeric(5, 2);
alter table public.month_closings drop constraint if exists month_closings_charity_percent_check;
alter table public.month_closings add constraint month_closings_charity_percent_check check (charity_percent is null or charity_percent between 0 and 100);

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
    (select min(month)::timestamp from public.month_closings),
    (select min(delivered_at at time zone 'Asia/Karachi') from public.orders where status = 'delivered')
  ))::date
$$;

-- 4. The month's figures. Same as before, plus the online section and the adjustable charity %.
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

  adj_sell := refills;
  adj_cost := taxes + bottles_opened;
  shop_sales := hw_sell + adj_sell + bt_sell + co_sell;
  shop_profit := (hw_sell + adj_sell - hw_cost - adj_cost) + (bt_sell - bt_cost) + (co_sell - co_cost);

  -- Online: orders delivered this month. Goods + the delivery fee the customer paid, less what the goods cost.
  select coalesce(sum(subtotal), 0), coalesce(sum(delivery_fee), 0), coalesce(sum(cost), 0), count(*)
  into on_goods, on_fees, on_cost, on_count
  from public.orders where status = 'delivered' and delivered_at >= v_from and delivered_at < v_to;
  select coalesce(sum(total), 0), count(*) into on_waiting, on_waiting_count
  from public.orders where status in ('placed', 'confirmed', 'shipped') and created_at >= v_from and created_at < v_to;
  on_sales := on_goods + on_fees;
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

  return jsonb_build_object(
    'month', m0,
    'inputs', jsonb_build_object(
      'oldAmount', rec.old_amount, 'personalInvestment', coalesce(rec.personal_investment, 0), 'investmentReturn', coalesce(rec.investment_return, 0),
      'withdrawalProfit', coalesce(rec.withdrawal_profit, 0), 'cash', coalesce(rec.cash, 0), 'bank', coalesce(rec.bank, 0),
      'rentPaid', coalesce(rec.rent_paid, 0), 'electricPaid', coalesce(rec.electric_paid, 0), 'matchAmount', rec.match_amount,
      'charityPercent', charity_pct),
    'firstMonth', m0 <= coalesce(public.first_month(), m0),
    'sections', jsonb_build_object(
      'hardware', jsonb_build_object('sales', hw_sell + adj_sell, 'cost', hw_cost + adj_cost, 'profit', hw_sell + adj_sell - hw_cost - adj_cost),
      'cashAdjustment', jsonb_build_object('sales', adj_sell, 'cost', adj_cost, 'refills', refills, 'taxes', taxes, 'bottlesOpened', bottles_opened),
      'bottles', jsonb_build_object('sales', bt_sell, 'cost', bt_cost, 'profit', bt_sell - bt_cost),
      'coils', jsonb_build_object('sales', co_sell, 'cost', co_cost, 'profit', co_sell - co_cost)),
    'shop', jsonb_build_object('sales', shop_sales, 'cost', shop_sales - shop_profit, 'profit', shop_profit),
    'online', jsonb_build_object('sales', on_sales, 'goods', on_goods, 'deliveryFees', on_fees, 'cost', on_cost, 'profit', on_profit,
      'count', on_count, 'waiting', on_waiting, 'waitingCount', on_waiting_count),
    'salesTotal', sales_total, 'profit', profit,
    'rent', rent, 'electric', electric, 'pay', pay, 'charity', charity, 'charityPercent', charity_pct,
    'directExpenses', direct, 'writeOffs', writeoffs, 'shopExpense', shop_expense, 'netProfit', net,
    'oldAmount', old_amount, 'paidRestock', paid_restock, 'restockAmount', restock_amount, 'diff', diff,
    'stockValue', stock_value, 'assets', assets, 'matchTotal', match_total,
    'matchDiff', case when rec.match_amount is null then null else match_total - rec.match_amount end,
    'discounts', jsonb_build_object('total', disc, 'count', disc_count, 'lastMonth', disc_prev),
    'extra', jsonb_build_object('total', extra, 'count', extra_count, 'lastMonth', extra_prev),
    'adjustedSales', coalesce((select jsonb_agg(jsonb_build_object('number', s.number, 'date', to_char(s.created_at at time zone 'Asia/Karachi', 'DD Mon'), 'listTotal', s.list_total, 'total', s.total,
        'items', (select string_agg(l.quantity || ' × ' || l.name, ', ' order by l.id) from public.sale_lines l where l.sale_id = s.id)) order by s.number desc)
      from (select * from public.sales where voided_at is null and created_at >= v_from and created_at < v_to and total <> list_total order by number desc limit 300) s), '[]'::jsonb),
    'closed', rec.closed_at is not null,
    'closedOn', to_char(rec.closed_at at time zone 'Asia/Karachi', 'DD Mon YYYY'),
    'locked', rec.locked_at is not null
  );
end;
$$;

-- 5. Saving now also takes the charity %.
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
  if coalesce(p_inputs ->> 'charityPercent', '') !~ '^([0-9]{1,3}(\.[0-9]{1,2})?)?$' or coalesce(nullif(p_inputs ->> 'charityPercent', '')::numeric, 0) > 100 then raise exception 'invalid_percent'; end if;
  update public.month_closings set
    old_amount = nullif(p_inputs ->> 'oldAmount', '')::numeric,
    personal_investment = coalesce(p_inputs ->> 'personalInvestment', '0')::integer,
    investment_return = coalesce(p_inputs ->> 'investmentReturn', '0')::integer,
    withdrawal_profit = coalesce(p_inputs ->> 'withdrawalProfit', '0')::integer,
    cash = coalesce(p_inputs ->> 'cash', '0')::integer,
    bank = coalesce(p_inputs ->> 'bank', '0')::integer,
    rent_paid = coalesce(p_inputs ->> 'rentPaid', '0')::integer,
    electric_paid = coalesce(p_inputs ->> 'electricPaid', '0')::integer,
    match_amount = nullif(p_inputs ->> 'matchAmount', '')::numeric,
    charity_percent = coalesce(nullif(p_inputs ->> 'charityPercent', '')::numeric, charity_percent)
  where month = m0;
  return public.month_figures(m0);
end;
$$;

revoke all on function public.month_figures(date) from public, anon, authenticated;
revoke all on function public.month_save(date, jsonb) from public, anon;
grant execute on function public.month_save(date, jsonb) to authenticated;
revoke all on function public.first_month() from public, anon;
grant execute on function public.first_month() to authenticated;
