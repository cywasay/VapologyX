-- Public bucket for admin profile pictures. Images only, 2 MB at most.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only admins may write, and only inside their own folder. Registration is public,
-- so without the role check any customer could use this bucket as free file hosting.
-- Replacing a picture needs insert, select and update together.
drop policy if exists "Admins upload their own avatar" on storage.objects;
create policy "Admins upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "Admins read their own avatar" on storage.objects;
create policy "Admins read their own avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "Admins replace their own avatar" on storage.objects;
create policy "Admins replace their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
)
with check (
  bucket_id = 'avatars'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
