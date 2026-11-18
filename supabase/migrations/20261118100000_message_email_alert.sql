-- Email the owner when a new contact message arrives, even when no admin tab is open.
-- Sent through Resend (resend.com). Nothing is sent until these Vault secrets exist
-- (Supabase dashboard → Project Settings → Vault → Add new secret):
--   resend_api_key    the Resend API key (re_…)                      required
--   alert_email_to    where alerts go (the Resend account's email   required
--                     until a domain is verified in Resend)
--   alert_email_from  optional, e.g. 'VapologyX <alerts@yourdomain>' (default: Resend's test sender)
--   site_url          optional, e.g. 'https://vapologyx.pk', adds a link to the inbox
-- The message text is sent as plain text only. Any problem here never stops the message being saved.

create extension if not exists pg_net with schema extensions;

create or replace function public.contact_message_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_to text;
  v_from text;
  v_site text;
  v_name text;
  v_body text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into v_to from vault.decrypted_secrets where name = 'alert_email_to';
  if coalesce(btrim(v_key), '') = '' or coalesce(btrim(v_to), '') = '' then return new; end if;

  -- A follow-up within 10 minutes of the same person's last message doesn't send another email.
  if exists (select 1 from public.contact_messages where email = new.email and id <> new.id and created_at > new.created_at - interval '10 minutes') then
    return new;
  end if;

  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'alert_email_from';
  select decrypted_secret into v_site from vault.decrypted_secrets where name = 'site_url';
  v_name := left(regexp_replace(new.name, '[[:cntrl:]]+', ' ', 'g'), 60);
  v_body := 'New message on the VapologyX contact form.' || E'\n\n'
    || 'From: ' || v_name || ' <' || new.email || '>' || E'\n\n'
    || left(new.message, 2000) || case when char_length(new.message) > 2000 then E'\n[…]' else '' end || E'\n\n'
    || case when coalesce(btrim(v_site), '') <> ''
         then 'Open the inbox: ' || rtrim(btrim(v_site), '/') || '/admin/dashboard/messages?c=' || replace(replace(new.email, '%', '%25'), '+', '%2B') || E'\n'
         else '' end
    || 'Reply to this email to answer the customer directly.';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || btrim(v_key), 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', coalesce(nullif(btrim(v_from), ''), 'VapologyX <onboarding@resend.dev>'),
      'to', jsonb_build_array(btrim(v_to)),
      'reply_to', new.email,
      'subject', 'New message from ' || v_name,
      'text', v_body),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  raise warning 'contact_message_alert failed: %', sqlerrm;
  return new;
end;
$$;
revoke all on function public.contact_message_alert() from public, anon, authenticated;

drop trigger if exists contact_message_alert on public.contact_messages;
create trigger contact_message_alert
after insert on public.contact_messages
for each row execute function public.contact_message_alert();
