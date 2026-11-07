-- A conversation is every message from the same email. Emails are stored in lowercase so they always match.
update public.contact_messages set email = lower(email) where email <> lower(email);
create index if not exists contact_messages_email_idx on public.contact_messages (email, created_at);

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
begin
  if char_length(v_name) not between 1 and 120
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 200
     or char_length(v_message) not between 1 and 2000 then
    return 'invalid';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 40 then
    return 'busy';
  end if;
  if exists (select 1 from public.contact_messages where email = v_email and message = v_message and created_at > now() - interval '10 minutes') then
    return 'ok';
  end if;
  insert into public.contact_messages (name, email, message) values (v_name, v_email, v_message);
  return 'ok';
end;
$$;

-- The inbox: one row per conversation, newest activity first. p_unread_only keeps only conversations with something unread.
create or replace function public.message_threads(p_offset integer, p_limit integer, p_unread_only boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_items jsonb;
begin
  perform public.require_admin();
  with t as (
    select email,
           (array_agg(name order by created_at desc))[1] as name,
           (array_agg(message order by created_at desc))[1] as last,
           max(created_at) as last_at,
           count(*)::integer as total,
           (count(*) filter (where read_at is null))::integer as unread
    from public.contact_messages group by email
  )
  select count(*) into v_total from t where not p_unread_only or unread > 0;
  with t as (
    select email,
           (array_agg(name order by created_at desc))[1] as name,
           (array_agg(message order by created_at desc))[1] as last,
           max(created_at) as last_at,
           count(*)::integer as total,
           (count(*) filter (where read_at is null))::integer as unread
    from public.contact_messages group by email
  )
  select coalesce(jsonb_agg(jsonb_build_object('email', email, 'name', name, 'last', left(last, 200), 'lastAt', last_at, 'total', total, 'unread', unread) order by last_at desc), '[]'::jsonb)
  into v_items
  from (select * from t where not p_unread_only or unread > 0 order by last_at desc offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 50)) page;
  return jsonb_build_object('total', v_total, 'items', v_items);
end;
$$;

create or replace function public.message_thread_read(p_email text, p_read boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  if p_read then
    update public.contact_messages set read_at = now() where email = lower(p_email) and read_at is null;
  else
    update public.contact_messages set read_at = null where id = (select id from public.contact_messages where email = lower(p_email) order by created_at desc limit 1);
  end if;
end;
$$;

create or replace function public.message_thread_delete(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  delete from public.contact_messages where email = lower(p_email);
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['message_threads(integer, integer, boolean)', 'message_thread_read(text, boolean)', 'message_thread_delete(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Live updates: the admin panel hears about each new message as it arrives (only admins can see rows, so only admins hear).
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contact_messages') then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end $$;
