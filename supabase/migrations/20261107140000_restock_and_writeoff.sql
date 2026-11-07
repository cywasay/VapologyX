-- Receiving stock and taking stock out for reasons other than a sale (damaged, sample, lost...).
-- Every stock change now also remembers what one unit cost at that moment, so a write-off can be counted as an expense later.

alter table public.stock_moves add column if not exists unit_cost numeric(14, 6);

update public.stock_moves m
set unit_cost = c.unit_cost
from public.product_costs c
where c.product_id = m.product_id and m.unit_cost is null;

create or replace function public.log_stock_move()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  moved integer;
begin
  if new.stock is null then return new; end if;
  if tg_op = 'INSERT' then
    moved := new.stock;
  else
    moved := new.stock - coalesce(old.stock, 0);
  end if;
  if moved = 0 then return new; end if;
  insert into public.stock_moves (product_id, product_name, change, stock_after, reason, note, created_by, unit_cost)
  values (
    new.id, new.name, moved, new.stock,
    coalesce(nullif(current_setting('app.stock_reason', true), ''), 'adjustment'),
    coalesce(current_setting('app.stock_note', true), ''),
    auth.uid(),
    (select c.unit_cost from public.product_costs c where c.product_id = new.id)
  );
  return new;
end;
$$;
revoke all on function public.log_stock_move() from public, anon, authenticated;

-- New boxes arrived: adds to the product's stock. Returns the new stock.
create or replace function public.counter_restock(p_product uuid, p_quantity integer, p_note text default '')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  prod public.products%rowtype;
begin
  perform public.require_admin();
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then raise exception 'invalid_stock: quantity'; end if;
  select * into prod from public.products where id = p_product for update;
  if not found or prod.stock is null then raise exception 'unavailable'; end if;
  perform set_config('app.stock_reason', 'restock', true);
  perform set_config('app.stock_note', left(btrim(coalesce(p_note, '')), 120), true);
  update public.products set stock = stock + p_quantity where id = prod.id returning stock into prod.stock;
  return prod.stock;
end;
$$;

-- Stock lost for a reason other than a sale. A short reason is required. Returns the new stock.
create or replace function public.counter_write_off(p_product uuid, p_quantity integer, p_note text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  prod public.products%rowtype;
  v_note text := left(btrim(coalesce(p_note, '')), 120);
begin
  perform public.require_admin();
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then raise exception 'invalid_stock: quantity'; end if;
  if v_note = '' then raise exception 'invalid_stock: note'; end if;
  select * into prod from public.products where id = p_product for update;
  if not found or prod.stock is null then raise exception 'unavailable'; end if;
  if prod.stock < p_quantity then raise exception 'out_of_stock: %', prod.name; end if;
  perform set_config('app.stock_reason', 'writeoff', true);
  perform set_config('app.stock_note', v_note, true);
  update public.products set stock = stock - p_quantity where id = prod.id returning stock into prod.stock;
  return prod.stock;
end;
$$;

revoke all on function public.counter_restock(uuid, integer, text) from public, anon;
grant execute on function public.counter_restock(uuid, integer, text) to authenticated;
revoke all on function public.counter_write_off(uuid, integer, text) from public, anon;
grant execute on function public.counter_write_off(uuid, integer, text) to authenticated;
