-- The numbers on the admin overview: the last seven shop days (Pakistan time) of counter sales, online orders, refills and
-- expenses, plus how many products are low on stock or sold out. Counter sales skip voided sales; online orders skip
-- cancelled ones. Admin-only.
create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d date := public.shop_day();
  v_from timestamptz := public.day_start(public.shop_day() - 6);
begin
  perform public.require_admin();
  return (
    with days as (
      select g::date as day from generate_series((d - 6)::timestamp, d::timestamp, interval '1 day') g
    ),
    counter as (
      select (created_at at time zone 'Asia/Karachi')::date as day, sum(total)::integer as total, count(*)::integer as n
      from public.sales where voided_at is null and created_at >= v_from group by 1
    ),
    online as (
      select (created_at at time zone 'Asia/Karachi')::date as day, sum(total)::integer as total, count(*)::integer as n
      from public.orders where status <> 'cancelled' and created_at >= v_from group by 1
    ),
    refills as (
      select (created_at at time zone 'Asia/Karachi')::date as day, sum(amount)::integer as total
      from public.refill_entries where undone_at is null and created_at >= v_from group by 1
    ),
    spent as (
      select day, sum(amount)::integer as total from public.expenses where removed_at is null and day >= d - 6 group by 1
    )
    select jsonb_build_object(
      'days', (
        select jsonb_agg(jsonb_build_object(
          'day', days.day,
          'counter', coalesce(c.total, 0), 'counterCount', coalesce(c.n, 0),
          'online', coalesce(o.total, 0), 'onlineCount', coalesce(o.n, 0),
          'refills', coalesce(r.total, 0), 'expenses', coalesce(s.total, 0)
        ) order by days.day)
        from days
        left join counter c on c.day = days.day
        left join online o on o.day = days.day
        left join refills r on r.day = days.day
        left join spent s on s.day = days.day
      ),
      -- "Low" matches LOW_STOCK in the shop code: 5 or fewer left.
      'lowStock', (select count(*) from public.products where stock between 1 and 5),
      'soldOut', (select count(*) from public.products where stock = 0)
    )
  );
end;
$$;

revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
