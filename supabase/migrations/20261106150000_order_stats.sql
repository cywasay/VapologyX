-- Numbers for the admin overview: how many orders in each status, and the revenue of every order that wasn't cancelled.
-- It runs with the caller's rights, so only admins (who can read orders) get real numbers.
create or replace function public.order_stats()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'counts', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) as n from public.orders group by status) s), '{}'::jsonb),
    'revenue', coalesce((select sum(total) from public.orders where status <> 'cancelled'), 0)
  )
$$;

revoke all on function public.order_stats() from public, anon;
grant execute on function public.order_stats() to authenticated;
