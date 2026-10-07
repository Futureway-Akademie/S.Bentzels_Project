-- Website Stephan Graf Bentzel-Sturmfeder: Datenbankschema (task-14)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run.
-- Details und Reihenfolge der Einrichtung: docs/SUPABASE_SETUP.md
--
-- Grundsätze
--  * Row Level Security auf ALLEN Tabellen.
--  * Öffentlich (anon) nur Lesen veröffentlichter Inhalte. Werke werden nur über die
--    View artworks_public gelesen, damit global ausgeblendete Angaben (z. B. Preise)
--    nicht über die API abrufbar sind.
--  * Anfragen (inquiries): öffentlich nur INSERT, niemals SELECT.
--  * Anmeldungen (registrations): nur Admins und die Edge Function (service_role),
--    damit die Kapazität serverseitig geprüft werden kann (task-24).
--  * Schreiben, Ändern, Löschen nur für Admins (Tabelle admins, Funktion is_admin()).
--  * Werke: nur das Bild ist Pflicht, alle anderen Angaben sind optional.

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administratoren
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Eingeloggte Nutzer dürfen nur den eigenen Eintrag lesen (zur Prüfung im Browser).
-- Einträge werden ausschließlich im SQL Editor angelegt, nie über die API.
create policy "admins: eigenen Eintrag lesen" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Globale Einstellungen (Sichtbarkeitsschalter der Galerie)
-- ---------------------------------------------------------------------------

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "site_settings: öffentlich lesen" on public.site_settings
  for select to anon, authenticated
  using (true);

create policy "site_settings: Admin schreibt" on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (key, value) values
  ('gallery_visibility', jsonb_build_object(
    'price', true,
    'dimensions', true,
    'technique', true,
    'year', true,
    'availability', true,
    'description', true
  ))
on conflict (key) do nothing;

-- Liefert den Wert eines Sichtbarkeitsschalters (Standard: sichtbar).
create or replace function public.gallery_flag(flag text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (s.value ->> flag)::boolean from public.site_settings s where s.key = 'gallery_visibility'),
    true
  );
$$;

revoke all on function public.gallery_flag(text) from public, anon, authenticated;
-- Funktionsrechte werden in Views mit den Rechten des Aufrufers geprüft, daher erforderlich.
grant execute on function public.gallery_flag(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Werke
-- ---------------------------------------------------------------------------

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  archived_at timestamptz,
  -- Pflicht: nur das Bild (die Adresse entsteht automatisch)
  slug text not null unique default ('werk-' || substr(gen_random_uuid()::text, 1, 8)),
  main_image_url text not null,
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  -- Optional: Vorschaubild und frei gewählter Bildausschnitt (Original bleibt erhalten)
  thumb_url text,
  thumb_crop jsonb,
  alt_text_de text,
  title_de text,
  title_en text,
  artist text,
  cycle text,
  year integer check (year between 1000 and 2999),
  technique_de text,
  technique_en text,
  support_de text,
  height_cm numeric check (height_cm > 0),
  width_cm numeric check (width_cm > 0),
  depth_cm numeric check (depth_cm > 0),
  framed boolean,
  is_multipart boolean not null default false,
  price_eur numeric check (price_eur >= 0),
  status text check (status in ('verfuegbar', 'reserviert', 'verkauft')),
  description_de text,
  description_en text,
  is_highlight boolean not null default false
);

create index artworks_sort_idx on public.artworks (sort_order);

alter table public.artworks enable row level security;

-- Kein öffentlicher Zugriff auf die Tabelle, Lesen nur über artworks_public.
create policy "artworks: Admin" on public.artworks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger artworks_updated_at before update on public.artworks
  for each row execute function public.set_updated_at();

-- Öffentliche Sicht auf Werke: nur veröffentlichte, nicht archivierte Werke, ausgeblendete
-- Angaben werden serverseitig auf NULL gesetzt (die Daten bleiben in der Tabelle erhalten).
-- Die View läuft bewusst mit den Rechten des Eigentümers (kein security_invoker).
create view public.artworks_public as
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
  case when public.gallery_flag('description') then a.description_en end as description_en
from public.artworks a
where a.is_published and a.archived_at is null;

revoke all on public.artworks_public from public, anon, authenticated;
grant select on public.artworks_public to anon, authenticated;

-- Prüft, ob ein Werk öffentlich sichtbar ist (für Regeln auf abhängigen Tabellen).
create or replace function public.artwork_is_public(p_artwork uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artworks a
    where a.id = p_artwork and a.is_published and a.archived_at is null
  );
$$;

revoke all on function public.artwork_is_public(uuid) from public, anon, authenticated;
grant execute on function public.artwork_is_public(uuid) to anon, authenticated;

create table public.artwork_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  image_url text not null,
  image_width integer check (image_width > 0),
  image_height integer check (image_height > 0)
);

create index artwork_images_artwork_idx on public.artwork_images (artwork_id, sort_order);

alter table public.artwork_images enable row level security;

create policy "artwork_images: öffentlich lesen" on public.artwork_images
  for select to anon, authenticated
  using (is_published and public.artwork_is_public(artwork_id));

create policy "artwork_images: Admin" on public.artwork_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger artwork_images_updated_at before update on public.artwork_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Werkstatistik (ohne Personenbezug: nur Zähler je Werk und Tag)
-- ---------------------------------------------------------------------------

create table public.artwork_stats (
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  clicks integer not null default 0,
  lightbox_opens integer not null default 0,
  inquiries integer not null default 0,
  primary key (artwork_id, day)
);

alter table public.artwork_stats enable row level security;

create policy "artwork_stats: Admin liest" on public.artwork_stats
  for select to authenticated
  using (public.is_admin());

-- Zählt ein Ereignis: view, click, lightbox oder inquiry. Speichert keine Nutzerdaten.
create or replace function public.track_artwork_event(p_artwork uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('view', 'click', 'lightbox', 'inquiry') then
    return;
  end if;
  if not public.artwork_is_public(p_artwork) then
    return;
  end if;
  insert into public.artwork_stats (artwork_id, day, views, clicks, lightbox_opens, inquiries)
  values (
    p_artwork,
    current_date,
    (p_event = 'view')::int,
    (p_event = 'click')::int,
    (p_event = 'lightbox')::int,
    (p_event = 'inquiry')::int
  )
  on conflict (artwork_id, day) do update set
    views = public.artwork_stats.views + excluded.views,
    clicks = public.artwork_stats.clicks + excluded.clicks,
    lightbox_opens = public.artwork_stats.lightbox_opens + excluded.lightbox_opens,
    inquiries = public.artwork_stats.inquiries + excluded.inquiries;
end;
$$;

revoke all on function public.track_artwork_event(uuid, text) from public, anon, authenticated;
grant execute on function public.track_artwork_event(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Journal
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  slug text not null unique,
  title_de text,
  title_en text,
  excerpt_de text,
  excerpt_en text,
  content_de text,
  content_en text,
  cover_image_url text,
  cover_image_width integer check (cover_image_width > 0),
  cover_image_height integer check (cover_image_height > 0),
  published_at timestamptz,
  status text not null default 'entwurf' check (status in ('entwurf', 'veroeffentlicht')),
  -- Abgeleitet aus dem Status, damit alle Tabellen is_published besitzen.
  is_published boolean generated always as (status = 'veroeffentlicht') stored
);

alter table public.posts enable row level security;

create policy "posts: öffentlich lesen" on public.posts
  for select to anon, authenticated
  using (status = 'veroeffentlicht' and (published_at is null or published_at <= now()));

create policy "posts: Admin" on public.posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Veranstaltungen
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  slug text not null unique,
  title_de text not null,
  title_en text,
  description_de text,
  description_en text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_name text,
  location_address text,
  image_url text,
  capacity integer not null default 0 check (capacity >= 0),
  registration_open boolean not null default false,
  recap_text_de text,
  check (ends_at >= starts_at)
);

alter table public.events enable row level security;

create policy "events: öffentlich lesen" on public.events
  for select to anon, authenticated
  using (is_published);

create policy "events: Admin" on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create or replace function public.event_is_public(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.events e where e.id = p_event and e.is_published);
$$;

revoke all on function public.event_is_public(uuid) from public, anon, authenticated;
grant execute on function public.event_is_public(uuid) to anon, authenticated;

create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  event_id uuid not null references public.events (id) on delete cascade,
  image_url text not null,
  image_width integer check (image_width > 0),
  image_height integer check (image_height > 0)
);

create index event_photos_event_idx on public.event_photos (event_id, sort_order);

alter table public.event_photos enable row level security;

create policy "event_photos: öffentlich lesen" on public.event_photos
  for select to anon, authenticated
  using (is_published and public.event_is_public(event_id));

create policy "event_photos: Admin" on public.event_photos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger event_photos_updated_at before update on public.event_photos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Kunstkurse
-- ---------------------------------------------------------------------------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  title_de text not null,
  title_en text,
  description_de text,
  description_en text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  capacity integer check (capacity >= 0),
  price_eur numeric check (price_eur >= 0),
  registration_open boolean not null default false,
  check (ends_at >= starts_at)
);

alter table public.courses enable row level security;

create policy "courses: öffentlich lesen" on public.courses
  for select to anon, authenticated
  using (is_published);

create policy "courses: Admin" on public.courses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vita
-- ---------------------------------------------------------------------------

create table public.vita_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  year integer not null check (year between 1000 and 2999),
  year_end integer check (year_end between 1000 and 2999),
  category text not null check (category in ('ausbildung', 'ausstellung', 'messe', 'kuratorisch')),
  title_de text not null,
  title_en text,
  place text
);

alter table public.vita_entries enable row level security;

create policy "vita_entries: öffentlich lesen" on public.vita_entries
  for select to anon, authenticated
  using (is_published);

create policy "vita_entries: Admin" on public.vita_entries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger vita_entries_updated_at before update on public.vita_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Presse und interessante Artikel
-- ---------------------------------------------------------------------------

create table public.press_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  title_de text,
  title_en text,
  thumbnail_url text,
  thumbnail_width integer check (thumbnail_width > 0),
  thumbnail_height integer check (thumbnail_height > 0),
  file_url text,
  file_type text check (file_type in ('image', 'pdf')),
  file_width integer check (file_width > 0),
  file_height integer check (file_height > 0),
  medium text,
  medium_type text check (medium_type in ('zeitung', 'magazin', 'onlineportal')),
  author text,
  published_at date,
  year integer check (year between 1000 and 2999),
  category text check (category in ('pressebericht', 'interview', 'portraet', 'ausstellung', 'kunst')),
  summary_de text,
  description_de text,
  external_url text,
  is_highlight boolean not null default false,
  -- Datei zuerst: Es genügt eine Datei oder ein Link, alles Weitere ist optional.
  check (file_url is not null or external_url is not null),
  check (file_url is null or file_type is not null)
);

alter table public.press_items enable row level security;

create policy "press_items: öffentlich lesen" on public.press_items
  for select to anon, authenticated
  using (is_published);

create policy "press_items: Admin" on public.press_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger press_items_updated_at before update on public.press_items
  for each row execute function public.set_updated_at();

create table public.curated_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  url text not null,
  title_de text,
  source text,
  note_de text,
  thumbnail_url text,
  thumbnail_width integer check (thumbnail_width > 0),
  thumbnail_height integer check (thumbnail_height > 0)
);

alter table public.curated_links enable row level security;

create policy "curated_links: öffentlich lesen" on public.curated_links
  for select to anon, authenticated
  using (is_published);

create policy "curated_links: Admin" on public.curated_links
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger curated_links_updated_at before update on public.curated_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Anfragen und Anmeldungen
-- ---------------------------------------------------------------------------

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  type text not null check (type in ('werk', 'seminar', 'vortrag', 'kunstkurs', 'bentzel_club', 'kontakt')),
  name text not null,
  email text not null,
  phone text,
  company text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  artwork_id uuid references public.artworks (id) on delete set null,
  status text not null default 'neu' check (status in ('neu', 'beantwortet', 'erledigt'))
);

create index inquiries_status_idx on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

-- Öffentlich nur Einfügen, niemals Lesen. Die Grenzen schützen vor Missbrauch.
create policy "inquiries: öffentlich einfügen" on public.inquiries
  for insert to anon, authenticated
  with check (
    status = 'neu'
    and length(name) between 1 and 200
    and length(email) between 3 and 320
    and length(coalesce(message, '')) <= 10000
    and length(coalesce(phone, '')) <= 100
    and length(coalesce(company, '')) <= 200
    and pg_column_size(payload) <= 20000
  );

create policy "inquiries: Admin" on public.inquiries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  company text,
  guests integer not null default 0 check (guests between 0 and 3),
  status text not null default 'angemeldet' check (status in ('angemeldet', 'warteliste', 'storniert'))
);

create index registrations_event_idx on public.registrations (event_id, status);

alter table public.registrations enable row level security;

-- Kein öffentlicher Zugriff: Anmeldungen laufen über die Edge Function (service_role),
-- die die Kapazität prüft. Admins sehen und bearbeiten alle Anmeldungen.
create policy "registrations: Admin" on public.registrations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger registrations_updated_at before update on public.registrations
  for each row execute function public.set_updated_at();
