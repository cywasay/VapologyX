-- Messages sent from the shop's Contact page. Nobody can read or write the table directly except admins;
-- visitors can only send, through send_contact_message, which checks everything on the server.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_unread_idx on public.contact_messages (created_at desc) where read_at is null;

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;
grant select, update, delete on table public.contact_messages to authenticated;
grant select, insert, update, delete on table public.contact_messages to service_role;

drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins change messages" on public.contact_messages;
create policy "Admins change messages" on public.contact_messages for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins delete messages" on public.contact_messages;
create policy "Admins delete messages" on public.contact_messages for delete to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The only way in. Returns 'ok', 'invalid' or 'busy' (too many messages in the last hour, which stops a flood).
create or replace function public.send_contact_message(p_name text, p_email text, p_message text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := btrim(coalesce(p_email, ''));
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
  if exists (select 1 from public.contact_messages where lower(email) = lower(v_email) and message = v_message and created_at > now() - interval '10 minutes') then
    return 'ok';
  end if;
  insert into public.contact_messages (name, email, message) values (v_name, v_email, v_message);
  return 'ok';
end;
$$;
revoke all on function public.send_contact_message(text, text, text) from public;
grant execute on function public.send_contact_message(text, text, text) to anon, authenticated;
