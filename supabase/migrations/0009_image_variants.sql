-- Bildgrößen für srcset (task-30)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0008). Details: docs/SUPABASE_SETUP.md
--
-- Zu jedem Bild werden zusätzlich zur 2400-px-Fassung eine 1600-px- und eine 800-px-Fassung
-- gespeichert (nur, wenn das Bild größer ist). Die Liste steht als JSON in `image_variants`:
-- [{"url": "...", "width": 800}, {"url": "...", "width": 1600}]. Der Browser wählt daraus je
-- nach Bildschirm die passende Größe. Ältere Bilder haben keine Liste und werden wie bisher
-- in ihrer einen Größe geladen.

alter table public.artworks
  add column if not exists image_variants jsonb not null default '[]'::jsonb;
alter table public.artwork_images
  add column if not exists image_variants jsonb not null default '[]'::jsonb;

alter table public.artworks
  drop constraint if exists artworks_image_variants_array;
alter table public.artworks
  add constraint artworks_image_variants_array
  check (jsonb_typeof(image_variants) = 'array');
alter table public.artwork_images
  drop constraint if exists artwork_images_image_variants_array;
alter table public.artwork_images
  add constraint artwork_images_image_variants_array
  check (jsonb_typeof(image_variants) = 'array');

-- Die öffentliche Sicht erhält die Liste als letzte Spalte (gleiche Maskierung wie zuvor).
create or replace view public.artworks_public as
select
  a.id,
  a.slug,
  a.sort_order,
  a.main_image_url,
  a.image_width,
  a.image_height,
  a.thumb_url,
  a.thumb_crop,
  a.alt_text_de,
  a.title_de,
  a.title_en,
  a.artist,
  a.cycle,
  a.framed,
  a.is_multipart,
  a.is_highlight,
  case when public.gallery_flag('year') then a.year end as year,
  case when public.gallery_flag('technique') then a.technique_de end as technique_de,
  case when public.gallery_flag('technique') then a.technique_en end as technique_en,
  case when public.gallery_flag('technique') then a.support_de end as support_de,
  case when public.gallery_flag('dimensions') then a.height_cm end as height_cm,
  case when public.gallery_flag('dimensions') then a.width_cm end as width_cm,
  case when public.gallery_flag('dimensions') then a.depth_cm end as depth_cm,
  case when public.gallery_flag('price') then a.price_eur end as price_eur,
  case when public.gallery_flag('availability') then a.status end as status,
  case when public.gallery_flag('description') then a.description_de end as description_de,
  case when public.gallery_flag('description') then a.description_en end as description_en,
  a.image_variants
from public.artworks a
where a.is_published and a.archived_at is null;

grant select on public.artworks_public to anon, authenticated;
