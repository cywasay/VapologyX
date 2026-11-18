-- 1. Store settings: the delivery fee and the order total from which delivery is free.
--    Owner's rule (2026-11-17): under the limit the customer pays the fee; from the limit up the shop pays.
--    One row only. Everyone can read it (the shop shows it); only admins change it, through store_settings_save.
create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  delivery_fee integer not null default 250 check (delivery_fee between 0 and 100000),
  free_delivery_from integer not null default 10000 check (free_delivery_from between 1 and 100000000),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
grant select, insert, update, delete on table public.store_settings to service_role;
drop policy if exists "Anyone reads store_settings" on public.store_settings;
create policy "Anyone reads store_settings" on public.store_settings for select to anon, authenticated using (true);

create or replace function public.store_settings_save(p_delivery_fee integer, p_free_delivery_from integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.store_settings;
begin
  perform public.require_admin();
  if p_delivery_fee is null or p_delivery_fee not between 0 and 100000 then raise exception 'invalid_fee'; end if;
  if p_free_delivery_from is null or p_free_delivery_from not between 1 and 100000000 then raise exception 'invalid_limit'; end if;
  update public.store_settings
  set delivery_fee = p_delivery_fee, free_delivery_from = p_free_delivery_from, updated_at = now(), updated_by = auth.uid()
  where id = 1
  returning * into s;
  return jsonb_build_object('deliveryFee', s.delivery_fee, 'freeDeliveryFrom', s.free_delivery_from);
end;
$$;
revoke all on function public.store_settings_save(integer, integer) from public, anon;
grant execute on function public.store_settings_save(integer, integer) to authenticated;

-- 2. Orders now take the fee and the free-delivery limit from store_settings. Nothing else changes.
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
  v_rules public.store_settings;
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

  select * into v_rules from public.store_settings where id = 1;
  v_fee := case when v_method = 'delivery' and v_sub > 0 and v_sub < coalesce(v_rules.free_delivery_from, 10000)
                then coalesce(v_rules.delivery_fee, 250) else 0 end;

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

-- 3. Contact form limits per person instead of for the whole shop.
--    Per email: 5 an hour. Per connection (IP, stored only as a hash): 10 an hour.
--    A whole-shop safety cap of 300 an hour stays, against floods from many addresses.
alter table public.contact_messages add column if not exists sender_hash text;
create index if not exists contact_messages_email_created_idx on public.contact_messages (email, created_at desc);
create index if not exists contact_messages_sender_created_idx on public.contact_messages (sender_hash, created_at desc) where sender_hash is not null;

create or replace function public.send_contact_message(p_name text, p_email text, p_message text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_ip text := btrim(split_part(coalesce(v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1));
  v_sender text := case when v_ip = '' then null else md5('vx-contact:' || v_ip) end;
begin
  if char_length(v_name) not between 1 and 120
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 200
     or char_length(v_message) not between 1 and 2000 then
    return 'invalid';
  end if;
  if exists (select 1 from public.contact_messages where email = v_email and message = v_message and created_at > now() - interval '10 minutes') then
    return 'ok';
  end if;
  if (select count(*) from public.contact_messages where email = v_email and created_at > now() - interval '1 hour') >= 5
     or (v_sender is not null and (select count(*) from public.contact_messages where sender_hash = v_sender and created_at > now() - interval '1 hour') >= 10)
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 300 then
    return 'busy';
  end if;
  insert into public.contact_messages (name, email, message, sender_hash) values (v_name, v_email, v_message, v_sender);
  return 'ok';
end;
$$;
