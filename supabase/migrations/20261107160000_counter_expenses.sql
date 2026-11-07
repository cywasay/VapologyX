-- Daily expenses entered at the counter. The kinds are the labels from the owner's closing sheet:
-- "Direct Exp" (Food, Tea, ptcl, Tissue, Freshner, Key, Exp, Ship) and the purchase costs behind GST (Shipping, CMC Tax, Elite Tax).
-- An expense can be marked as paid from the cash drawer, in which case it lowers the cash the drawer should hold.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  kind text not null check (kind in ('Food', 'Tea', 'PTCL', 'Tissue', 'Freshner', 'Key', 'Exp', 'Ship', 'Shipping', 'CMC Tax', 'Elite Tax')),
  amount integer not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 120),
  from_drawer boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  removed_at timestamptz
);
create index if not exists expenses_day_idx on public.expenses (day);

alter table public.expenses enable row level security;
revoke all on table public.expenses from anon, authenticated;
grant select on table public.expenses to authenticated;
grant select, insert, update, delete on table public.expenses to service_role;
drop policy if exists "Admins read expenses" on public.expenses;
create policy "Admins read expenses" on public.expenses for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.counter_add_expense(p_kind text, p_amount integer, p_note text, p_from_drawer boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.expenses;
begin
  perform public.require_admin();
  perform public.open_day();
  if p_kind is null or p_kind not in ('Food', 'Tea', 'PTCL', 'Tissue', 'Freshner', 'Key', 'Exp', 'Ship', 'Shipping', 'CMC Tax', 'Elite Tax') then raise exception 'invalid_expense: kind'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000000 then raise exception 'invalid_expense: amount'; end if;
  insert into public.expenses (day, kind, amount, note, from_drawer, created_by)
  values (public.shop_day(), p_kind, p_amount, left(btrim(coalesce(p_note, '')), 120), coalesce(p_from_drawer, true), auth.uid())
  returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'kind', v_row.kind, 'amount', v_row.amount, 'note', v_row.note, 'fromDrawer', v_row.from_drawer);
end;
$$;

create or replace function public.counter_remove_expense(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  perform public.open_day();
  update public.expenses set removed_at = now() where id = p_id and day = public.shop_day() and removed_at is null;
  if not found then raise exception 'not_found'; end if;
end;
$$;

-- The counter screen now also gets today's expenses.
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
    'cashOuts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'amount', c.amount, 'note', c.note) order by c.created_at) from public.cash_outs c where c.day = d and c.removed_at is null), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'amount', x.amount, 'note', x.note, 'fromDrawer', x.from_drawer) order by x.created_at) from public.expenses x where x.day = d and x.removed_at is null), '[]'::jsonb)
  );
end;
$$;

-- Closing now takes expenses paid from the drawer off the cash the drawer should hold.
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
  v_exp_all integer;
  v_exp_drawer integer;
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
  v_exp_all := coalesce((select sum(amount) from public.expenses where day = d and removed_at is null), 0);
  v_exp_drawer := coalesce((select sum(amount) from public.expenses where day = d and removed_at is null and from_drawer), 0);
  v_expected := v_day.opening_cash + v_cash + v_refills - v_outs - v_exp_drawer;

  update public.counter_days
  set closed_at = now(), closed_by = auth.uid(), counted_cash = p_counted, expected_cash = v_expected, difference = p_counted - v_expected,
      summary = jsonb_build_object('opening', v_day.opening_cash, 'salesByPay', v_by_pay, 'refills', v_refills, 'cashOuts', v_outs, 'expenses', v_exp_all, 'expensesFromDrawer', v_exp_drawer)
  where day = d;

  return jsonb_build_object('counted', p_counted, 'expected', v_expected, 'difference', p_counted - v_expected);
end;
$$;

revoke all on function public.counter_add_expense(text, integer, text, boolean) from public, anon;
grant execute on function public.counter_add_expense(text, integer, text, boolean) to authenticated;
revoke all on function public.counter_remove_expense(uuid) from public, anon;
grant execute on function public.counter_remove_expense(uuid) to authenticated;
