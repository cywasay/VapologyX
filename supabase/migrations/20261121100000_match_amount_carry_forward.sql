-- Owner's answer 31 (2026-11-21): the Match Amount stays the same until money is put in or taken out.
-- An empty Match Amount now uses the latest earlier month's figure, the same way charity % carries forward.
-- Everything else in month_figures is unchanged from 20261117100000_online_closing_charity.sql.

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

  -- Match Amount stays the same from month to month until the owner types a new one (owner, 2026-11-21).
  match_amt := coalesce(rec.match_amount,
    (select match_amount from public.month_closings where month < m0 and match_amount is not null order by month desc limit 1));

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
      'count', on_count, 'waiting', on_waiting, 'waitingCount', on_waiting_count),
    'salesTotal', sales_total, 'profit', profit,
    'rent', rent, 'electric', electric, 'pay', pay, 'charity', charity, 'charityPercent', charity_pct,
    'directExpenses', direct, 'writeOffs', writeoffs, 'shopExpense', shop_expense, 'netProfit', net,
    'oldAmount', old_amount, 'paidRestock', paid_restock, 'restockAmount', restock_amount, 'diff', diff,
    'stockValue', stock_value, 'assets', assets, 'matchTotal', match_total,
    'matchDiff', case when match_amt is null then null else match_total - match_amt end,
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

revoke all on function public.month_figures(date) from public, anon, authenticated;
