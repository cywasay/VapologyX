-- Owner-only inventory data: what each product costs, and a history of every stock change.
-- The shop reads public.products, which has no cost on it. Costs live here, where only admins can reach them.

-- True for a signed-in admin. Used by the functions below; the table policies spell the same check out.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- What one unit cost us. Exact decimals, so a cost like 15028 / 9 doesn't pick up rounding errors.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  unit_cost numeric(14, 6) not null default 0 check (unit_cost >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_costs enable row level security;
revoke all on table public.product_costs from anon, authenticated;
grant select, insert, update, delete on table public.product_costs to authenticated;
grant select, insert, update, delete on table public.product_costs to service_role;

drop policy if exists "Admins manage costs" on public.product_costs;
create policy "Admins manage costs"
on public.product_costs for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop trigger if exists product_costs_set_updated_at on public.product_costs;
create trigger product_costs_set_updated_at
before update on public.product_costs
for each row execute function public.set_updated_at();

-- Every change to a product's stock, written by a trigger so nothing can change stock without leaving a line here.
create table if not exists public.stock_moves (
  id bigint generated always as identity primary key,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  change integer not null check (change <> 0),
  stock_after integer not null check (stock_after >= 0),
  reason text not null default 'adjustment' check (reason in ('import', 'sale', 'void', 'order', 'order_cancel', 'restock', 'refill', 'writeoff', 'adjustment')),
  note text not null default '',
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists stock_moves_product_idx on public.stock_moves (product_id, created_at desc);
create index if not exists stock_moves_created_idx on public.stock_moves (created_at desc);

alter table public.stock_moves enable row level security;
revoke all on table public.stock_moves from anon, authenticated;
grant select on table public.stock_moves to authenticated;
grant select, insert, update, delete on table public.stock_moves to service_role;

drop policy if exists "Admins read stock history" on public.stock_moves;
create policy "Admins read stock history"
on public.stock_moves for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The reason comes from the function that made the change (set_config 'app.stock_reason'); otherwise it is an adjustment.
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
  insert into public.stock_moves (product_id, product_name, change, stock_after, reason, note, created_by)
  values (
    new.id, new.name, moved, new.stock,
    coalesce(nullif(current_setting('app.stock_reason', true), ''), 'adjustment'),
    coalesce(current_setting('app.stock_note', true), ''),
    auth.uid()
  );
  return new;
end;
$$;
revoke all on function public.log_stock_move() from public, anon, authenticated;

drop trigger if exists products_log_stock on public.products;
create trigger products_log_stock
after insert or update of stock on public.products
for each row execute function public.log_stock_move();

-- Online orders and cancellations now say why the stock moved.
create or replace function public.orders_adjust_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  l jsonb;
  sign integer;
begin
  if (old.status = 'cancelled') = (new.status = 'cancelled') then return new; end if;
  sign := case when new.status = 'cancelled' then 1 else -1 end;
  perform set_config('app.stock_reason', case when sign = 1 then 'order_cancel' else 'order' end, true);
  perform set_config('app.stock_note', new.number, true);
  for l in select value from jsonb_array_elements(new.lines) loop
    update public.products
    set stock = greatest(0, stock + sign * (l ->> 'quantity')::integer)
    where id = (l ->> 'productId')::uuid and stock is not null;
  end loop;
  return new;
end;
$$;

create or replace function public.place_order(draft jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := draft -> 'customer';
  d jsonb := draft -> 'delivery';
  v_name text := btrim(coalesce(c ->> 'name', ''));
  v_phone text := public.normalize_phone(c ->> 'phone');
  v_email text := btrim(coalesce(c ->> 'email', ''));
  v_method text := d ->> 'method';
  v_address text := btrim(coalesce(d ->> 'address', ''));
  v_city text := btrim(coalesce(d ->> 'city', ''));
  v_notes text := btrim(coalesce(d ->> 'notes', ''));
  v_payment text := draft ->> 'payment';
  item jsonb;
  prod public.products%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_used jsonb := '{}'::jsonb;
  v_qty integer;
  v_price integer;
  v_variety text;
  v_option jsonb;
  v_sub integer := 0;
  v_fee integer;
  v_number text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_order public.orders;
  r record;
begin
  if jsonb_typeof(draft -> 'lines') is distinct from 'array' or jsonb_array_length(draft -> 'lines') not between 1 and 30 then
    raise exception 'invalid_order: lines';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'invalid_order: name'; end if;
  if v_phone is null then raise exception 'invalid_order: phone'; end if;
  if v_email <> '' and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_order: email'; end if;
  if v_method not in ('delivery', 'pickup') then raise exception 'invalid_order: method'; end if;
  if v_payment not in ('cod', 'transfer') then raise exception 'invalid_order: payment'; end if;
  if v_method = 'pickup' then
    v_address := '';
    v_city := '';
  elsif char_length(v_address) < 8 or char_length(v_city) < 2 then
    raise exception 'invalid_order: address';
  end if;
  v_notes := left(v_notes, 300);

  perform 1 from public.products
  where id in (select (value ->> 'productId')::uuid from jsonb_array_elements(draft -> 'lines'))
  order by id
  for update;

  for item in select value from jsonb_array_elements(draft -> 'lines') loop
    v_qty := (item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'invalid_order: quantity'; end if;
    select * into prod from public.products where id = (item ->> 'productId')::uuid and is_published;
    if not found then raise exception 'unavailable: %', coalesce(item ->> 'productId', ''); end if;

    v_price := prod.price;
    v_variety := nullif(btrim(coalesce(item ->> 'variety', '')), '');
    if v_variety is not null then
      select value into v_option from jsonb_array_elements(prod.variants) where value ->> 'name' = v_variety limit 1;
      if v_option is null then raise exception 'unavailable: %', prod.name; end if;
      v_price := coalesce((v_option ->> 'price')::integer, prod.price);
    end if;

    v_used := jsonb_set(v_used, array[prod.id::text], to_jsonb(coalesce((v_used ->> prod.id::text)::integer, 0) + v_qty));
    if prod.stock is not null and prod.stock < (v_used ->> prod.id::text)::integer then
      raise exception 'out_of_stock: %', prod.name;
    end if;

    v_sub := v_sub + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'productId', prod.id, 'slug', prod.slug, 'name', prod.name, 'variety', v_variety,
      'unitPrice', v_price, 'quantity', v_qty, 'category', prod.category, 'type', prod.type,
      'color', prod.color, 'image_url', prod.image_url
    );
  end loop;

  perform set_config('app.stock_reason', 'order', true);
  for r in select key, value from jsonb_each_text(v_used) loop
    update public.products set stock = stock - r.value::integer where id = r.key::uuid and stock is not null;
  end loop;

  v_fee := case when v_method = 'delivery' and v_sub > 0 and v_sub < 10000 then 250 else 0 end;

  loop
    v_number := 'VX-' || (select string_agg(substr(v_alphabet, 1 + floor(random() * 32)::integer, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from public.orders where number = v_number);
  end loop;

  insert into public.orders (number, customer_name, customer_phone, customer_email, delivery_method, address, city, notes, payment, lines, subtotal, delivery_fee, total)
  values (v_number, v_name, v_phone, v_email, v_method, v_address, v_city, v_notes, v_payment, v_lines, v_sub, v_fee, v_sub + v_fee)
  returning * into v_order;

  return public.order_json(v_order);
end;
$$;

-- Admin-only. Loads stock from the owner's spreadsheet: products that already exist (same shelf and name) get their
-- price, stock and cost updated; new ones are added. Each row: category, name, brand, qty, cost, price.
create or replace function public.import_inventory(rows jsonb, replace_all boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r jsonb;
  pid uuid;
  v_cat text;
  v_name text;
  v_brand text;
  v_qty integer;
  v_cost numeric;
  v_price integer;
  v_base text;
  v_slug text;
  v_try integer;
  v_added integer := 0;
  v_updated integer := 0;
  v_removed integer := 0;
  v_seen jsonb := '{}'::jsonb;
  v_key text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can import stock' using errcode = '42501';
  end if;
  if jsonb_typeof(rows) is distinct from 'array' or jsonb_array_length(rows) not between 1 and 1000 then
    raise exception 'invalid_import: rows';
  end if;

  perform set_config('app.stock_reason', 'import', true);

  -- Check every row before touching anything.
  for r in select value from jsonb_array_elements(rows) loop
    v_cat := r ->> 'category';
    v_name := btrim(coalesce(r ->> 'name', ''));
    if v_cat is null or v_cat not in ('device', 'disposable', 'bottle', 'coil') then raise exception 'invalid_import: category of %', v_name; end if;
    if char_length(v_name) < 1 or char_length(v_name) > 120 then raise exception 'invalid_import: name %', v_name; end if;
    if (r ->> 'qty') is null or (r ->> 'qty') !~ '^[0-9]+$' then raise exception 'invalid_import: qty of %', v_name; end if;
    if (r ->> 'cost') is null or (r ->> 'cost') !~ '^[0-9]+(\.[0-9]+)?$' then raise exception 'invalid_import: cost of %', v_name; end if;
    if (r ->> 'price') is null or (r ->> 'price') !~ '^[0-9]+$' then raise exception 'invalid_import: price of %', v_name; end if;
    v_key := v_cat || '|' || lower(v_name);
    if v_seen ? v_key then raise exception 'invalid_import: % is listed twice', v_name; end if;
    v_seen := v_seen || jsonb_build_object(v_key, true);
  end loop;

  if replace_all then
    delete from public.products where true;
    get diagnostics v_removed = row_count;
  end if;

  for r in select value from jsonb_array_elements(rows) loop
    v_cat := r ->> 'category';
    v_name := btrim(r ->> 'name');
    v_brand := btrim(coalesce(r ->> 'brand', ''));
    v_qty := (r ->> 'qty')::integer;
    v_cost := (r ->> 'cost')::numeric;
    v_price := (r ->> 'price')::integer;

    select id into pid from public.products where category = v_cat and lower(name) = lower(v_name) limit 1;
    if pid is null then
      v_base := btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-');
      if v_base = '' then v_base := 'product'; end if;
      v_slug := v_base;
      if exists (select 1 from public.products where slug = v_slug) then v_slug := v_base || '-' || v_cat; end if;
      v_try := 1;
      while exists (select 1 from public.products where slug = v_slug) loop
        v_try := v_try + 1;
        v_slug := v_base || '-' || v_cat || '-' || v_try;
      end loop;
      insert into public.products (slug, name, category, price, stock, specs)
      values (v_slug, v_name, v_cat, v_price, v_qty,
        case when v_brand = '' then '[]'::jsonb else jsonb_build_array(jsonb_build_object('label', 'Brand', 'value', v_brand)) end)
      returning id into pid;
      v_added := v_added + 1;
    else
      update public.products set price = v_price, stock = v_qty where id = pid;
      v_updated := v_updated + 1;
    end if;

    insert into public.product_costs (product_id, unit_cost) values (pid, v_cost)
    on conflict (product_id) do update set unit_cost = excluded.unit_cost;
  end loop;

  return jsonb_build_object('added', v_added, 'updated', v_updated, 'removed', v_removed);
end;
$$;
revoke all on function public.import_inventory(jsonb, boolean) from public, anon;
grant execute on function public.import_inventory(jsonb, boolean) to authenticated;
