-- Speicher für Bilder und PDFs (task-15)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001_schema.sql). Details: docs/SUPABASE_SETUP.md
--
-- Buckets sind öffentlich lesbar (Bilder erscheinen auf der Website über ihre Adresse).
-- Hochladen, Ersetzen und Löschen dürfen nur Admins. Erlaubt sind nur Bild- und PDF-Dateien
-- bis zu einer festen Größe.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('artworks', 'artworks', true, 10485760, array['image/webp', 'image/jpeg', 'image/png']),
  ('posts',    'posts',    true, 10485760, array['image/webp', 'image/jpeg', 'image/png']),
  ('events',   'events',   true, 10485760, array['image/webp', 'image/jpeg', 'image/png']),
  ('people',   'people',   true, 10485760, array['image/webp', 'image/jpeg', 'image/png']),
  ('press',    'press',    true, 26214400, array['image/webp', 'image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Dateien in diesen Buckets verwaltet nur ein Admin. Öffentliches Lesen über die Adresse
-- der Datei braucht bei öffentlichen Buckets keine Regel, das Auflisten bleibt Admins vorbehalten.
create policy "storage: Admin liest" on storage.objects
  for select to authenticated
  using (bucket_id in ('artworks', 'posts', 'events', 'people', 'press') and public.is_admin());

create policy "storage: Admin lädt hoch" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('artworks', 'posts', 'events', 'people', 'press') and public.is_admin());

create policy "storage: Admin ersetzt" on storage.objects
  for update to authenticated
  using (bucket_id in ('artworks', 'posts', 'events', 'people', 'press') and public.is_admin())
  with check (bucket_id in ('artworks', 'posts', 'events', 'people', 'press') and public.is_admin());

create policy "storage: Admin löscht" on storage.objects
  for delete to authenticated
  using (bucket_id in ('artworks', 'posts', 'events', 'people', 'press') and public.is_admin());

-- Vorschaubilder (800 px) auch für weitere Bilder je Werk und Eventfotos
alter table public.artwork_images add column if not exists thumb_url text;
alter table public.event_photos add column if not exists thumb_url text;
