-- Customer orders. Nobody can read or write this table directly except admins.
-- Customers place and look up orders only through the two functions below, which check everything on the server.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  status text not null default 'placed' check (status in ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (customer_phone ~ '^03[0-9]{9}$'),
  customer_email text not null default '' check (char_length(customer_email) <= 200),
  delivery_method text not null check (delivery_method in ('delivery', 'pickup')),
  address text not null default '' check (char_length(address) <= 300),
  city text not null default '' check (char_length(city) <= 100),
  notes text not null default '' check (char_length(notes) <= 300),
  payment text not null check (payment in ('cod', 'transfer')),
  lines jsonb not null check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) between 1 and 30),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_phone_idx on public.orders (customer_phone);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;
grant select, update on table public.orders to authenticated;
grant select, insert, update, delete on table public.orders to service_role;

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can change orders" on public.orders;
create policy "Admins can change orders"
on public.orders for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 0300 1234567, +92 300 1234567 and 923001234567 all become 03001234567. Anything else gives null.
create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when d ~ '^(0092|92|0)?3[0-9]{9}$' then '0' || right(d, 10) else null end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) s
$$;

-- An order in the shape the shop pages use.
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
    'total', o.total
  )
$$;
revoke all on function public.order_json(public.orders) from public, anon, authenticated;

-- Places an order. Prices, options and stock are read from the products table here, never trusted from the browser.
-- The draft: { customer: {name, phone, email}, delivery: {method, address, city, notes}, payment, lines: [{productId, variety, quantity}] }
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

  -- Lock every product in the order, always in the same order, so two orders can't oversell the last item.
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

    -- Options of one product share its stock.
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

  for r in select key, value from jsonb_each_text(v_used) loop
    update public.products set stock = stock - r.value::integer where id = r.key::uuid and stock is not null;
  end loop;

  -- Placeholder delivery rules. They move to a Store settings table later.
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

-- Looks up one order. It only answers when the order number and the mobile number it was placed with both match.
create or replace function public.find_order(p_number text, p_phone text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders
  where number = upper(btrim(coalesce(p_number, ''))) and customer_phone = public.normalize_phone(p_phone);
  if not found then return null; end if;
  return public.order_json(v_order);
end;
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.find_order(text, text) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.find_order(text, text) to anon, authenticated;

-- Cancelling an order puts its items back on the shelf, and un-cancelling takes them off again.
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
  for l in select value from jsonb_array_elements(new.lines) loop
    update public.products
    set stock = greatest(0, stock + sign * (l ->> 'quantity')::integer)
    where id = (l ->> 'productId')::uuid and stock is not null;
  end loop;
  return new;
end;
$$;

drop trigger if exists orders_adjust_stock on public.orders;
create trigger orders_adjust_stock
after update of status on public.orders
for each row execute function public.orders_adjust_stock();
