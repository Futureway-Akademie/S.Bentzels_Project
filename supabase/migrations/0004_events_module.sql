-- Gemeinsames Veranstaltungsmodul (task-40)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0003). Details: docs/SUPABASE_SETUP.md
--
-- Grundsätze
--  * Ein Modul für Seminare, Gruppenkurse, Workshops, Vorlesungen, Events, Ausstellungen und
--    Kunstprojekte. Die Art ist eine erweiterbare Tabelle (event_types). Die getrennte Tabelle
--    courses entfällt, ihre Zeilen werden nach events übernommen.
--  * Pflicht ist nur der Titel. Alle anderen Angaben sind optional.
--  * Der erste Termin steht in events (starts_at, ends_at), weitere Termine in event_dates.
--    Eine Veranstaltung mit mehreren Terminen ist damit von mehreren eigenständigen
--    Veranstaltungen getrennt.
--  * Öffentlich wird nur die View events_public gelesen. Angaben, die in site_settings
--    (Schlüssel event_visibility) ausgeschaltet sind, sind dort serverseitig leer.
--  * Statistik ohne Personenbezug: nur Zähler je Veranstaltung und Tag.
--  * Rolle Event-Redakteur: darf nur Veranstaltungsdaten verwalten. Die Datenbank erzwingt das.

-- ---------------------------------------------------------------------------
-- Rollen
-- ---------------------------------------------------------------------------

alter table public.admins add column if not exists role text not null default 'admin'
  check (role in ('admin', 'event_editor'));

-- is_admin() bleibt dem vollen Administrator vorbehalten.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'admin');
$$;

-- Administratoren und Event-Redakteure.
create or replace function public.is_event_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid() and a.role in ('admin', 'event_editor')
  );
$$;

revoke all on function public.is_event_editor() from public, anon, authenticated;
grant execute on function public.is_event_editor() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Veranstaltungsarten (erweiterbar)
-- ---------------------------------------------------------------------------

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  slug text not null unique,
  name_de text not null check (char_length(btrim(name_de)) > 0),
  name_en text
);

alter table public.event_types enable row level security;

create policy "event_types: öffentlich lesen" on public.event_types
  for select to anon, authenticated
  using (is_published);

create policy "event_types: Event-Redakteur" on public.event_types
  for all to authenticated
  using (public.is_event_editor())
  with check (public.is_event_editor());

create trigger event_types_updated_at before update on public.event_types
  for each row execute function public.set_updated_at();

insert into public.event_types (slug, name_de, name_en, sort_order) values
  ('seminar', 'Seminar', 'Seminar', 10),
  ('gruppenkurs', 'Gruppenkurs', 'Group course', 20),
  ('workshop', 'Workshop', 'Workshop', 30),
  ('vorlesung', 'Vorlesung', 'Lecture', 40),
  ('event', 'Event', 'Event', 50),
  ('ausstellung', 'Ausstellung', 'Exhibition', 60),
  ('kunstprojekt', 'Kunstprojekt', 'Art project', 70),
  ('sonstige', 'Sonstige Veranstaltung', 'Other event', 80)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Veranstaltungen: Pflicht nur der Titel
-- ---------------------------------------------------------------------------

alter table public.events alter column starts_at drop not null;
alter table public.events alter column ends_at drop not null;
alter table public.events alter column capacity drop not null;
alter table public.events alter column capacity drop default;
update public.events set capacity = null where capacity = 0;
alter table public.events alter column slug set default ('veranstaltung-' || substr(gen_random_uuid()::text, 1, 8));
alter table public.events add constraint events_title_not_blank check (char_length(btrim(title_de)) > 0);

alter table public.events
  add column type_id uuid references public.event_types (id) on delete set null,
  add column category text,
  add column status text not null default 'geplant'
    check (status in ('geplant', 'anmeldung_moeglich', 'wenige_plaetze', 'ausgebucht', 'verschoben', 'abgesagt', 'beendet', 'archiviert')),
  add column is_featured boolean not null default false,
  add column archive_visible boolean not null default true,
  add column short_description_de text,
  add column short_description_en text,
  add column show_time boolean not null default true,
  add column is_multi_day boolean not null default false,
  add column recurrence_rule text,
  add column image_thumb_url text,
  add column image_width integer check (image_width > 0),
  add column image_height integer check (image_height > 0),
  add column speaker_name text,
  add column places_available integer check (places_available >= 0),
  add column price_eur numeric check (price_eur >= 0),
  add column price_on_request boolean not null default false,
  add column price_note_de text,
  add column registration_deadline timestamptz,
  -- Vorbereitung: später verbindliche Anmeldung statt reiner Anfrage
  add column registration_mode text not null default 'anfrage' check (registration_mode in ('anfrage', 'verbindlich')),
  add column audience_de text,
  add column requirements_de text,
  add column materials_de text,
  add column included_de text,
  add column contact_name text,
  add column contact_email text,
  add column contact_phone text,
  add column pdf_url text,
  add column pdf_label_de text,
  add column external_url text check (external_url is null or external_url ~* '^https?://'),
  add column internal_note text,
  add column copied_from uuid references public.events (id) on delete set null,
  add constraint events_places_within_capacity check (capacity is null or places_available is null or places_available <= capacity);

create index events_type_idx on public.events (type_id);
create index events_start_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- Weitere Termine einer Veranstaltung (mehrere und wiederkehrende Termine)
-- ---------------------------------------------------------------------------

create table public.event_dates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  note_de text,
  is_cancelled boolean not null default false,
  check (ends_at is null or ends_at >= starts_at)
);

create index event_dates_event_idx on public.event_dates (event_id, starts_at);

alter table public.event_dates enable row level security;

-- Kein direkter öffentlicher Zugriff, Lesen nur über die View event_occurrences.
create policy "event_dates: Event-Redakteur" on public.event_dates
  for all to authenticated
  using (public.is_event_editor())
  with check (public.is_event_editor());

create trigger event_dates_updated_at before update on public.event_dates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sichtbarkeit: laufende Veranstaltung oder Archiv
-- ---------------------------------------------------------------------------

-- Eine Veranstaltung ist „laufend“, solange sie nicht beendet oder archiviert ist und ihr
-- letzter Termin höchstens einen Tag zurückliegt (ohne Termin: laufend).
create or replace function public.event_is_current(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event
      and e.status not in ('beendet', 'archiviert')
      and coalesce(
        greatest(e.ends_at, e.starts_at, (select max(coalesce(d.ends_at, d.starts_at)) from public.event_dates d where d.event_id = e.id)),
        now()
      ) >= now() - interval '1 day'
  );
$$;

revoke all on function public.event_is_current(uuid) from public, anon, authenticated;
grant execute on function public.event_is_current(uuid) to anon, authenticated;

-- Öffentlich sichtbar: veröffentlicht, und entweder laufend oder im sichtbaren Archiv.
create or replace function public.event_is_public(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event and e.is_published and (e.archive_visible or public.event_is_current(e.id))
  );
$$;

revoke all on function public.event_is_public(uuid) from public, anon, authenticated;
grant execute on function public.event_is_public(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sichtbarkeitsschalter für Veranstaltungen
-- ---------------------------------------------------------------------------

insert into public.site_settings (key, value) values
  ('event_visibility', jsonb_build_object(
    'price', true,
    'free_places', true,
    'participants', true,
    'speaker', true,
    'location', true
  ))
on conflict (key) do nothing;

create or replace function public.event_flag(flag text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (s.value ->> flag)::boolean from public.site_settings s where s.key = 'event_visibility'),
    true
  );
$$;

revoke all on function public.event_flag(text) from public, anon, authenticated;
grant execute on function public.event_flag(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Öffentliche Sicht: events_public und event_occurrences
-- ---------------------------------------------------------------------------

-- Die Tabelle events ist für Besucher gesperrt. Interne Notizen und ausgeschaltete Angaben
-- verlassen die Datenbank nicht.
drop policy "events: öffentlich lesen" on public.events;

create policy "events: Event-Redakteur" on public.events
  for all to authenticated
  using (public.is_event_editor())
  with check (public.is_event_editor());

create view public.events_public as
select
  e.id,
  e.slug,
  e.sort_order,
  e.type_id,
  e.category,
  e.status,
  e.is_featured,
  e.title_de,
  e.title_en,
  e.short_description_de,
  e.short_description_en,
  e.description_de,
  e.description_en,
  e.recap_text_de,
  e.starts_at,
  e.ends_at,
  e.show_time,
  e.is_multi_day,
  e.image_url,
  e.image_thumb_url,
  e.image_width,
  e.image_height,
  e.registration_open,
  e.registration_deadline,
  e.registration_mode,
  e.audience_de,
  e.requirements_de,
  e.materials_de,
  e.included_de,
  e.contact_name,
  e.contact_email,
  e.contact_phone,
  e.pdf_url,
  e.pdf_label_de,
  e.external_url,
  case when public.event_flag('location') then e.location_name end as location_name,
  case when public.event_flag('location') then e.location_address end as location_address,
  case when public.event_flag('speaker') then e.speaker_name end as speaker_name,
  case when public.event_flag('participants') then e.capacity end as capacity,
  case when public.event_flag('free_places') then e.places_available end as places_available,
  case when public.event_flag('price') then e.price_eur end as price_eur,
  case when public.event_flag('price') then e.price_on_request end as price_on_request,
  case when public.event_flag('price') then e.price_note_de end as price_note_de
from public.events e
where e.is_published and (e.archive_visible or public.event_is_current(e.id));

revoke all on public.events_public from public, anon, authenticated;
grant select on public.events_public to anon, authenticated;

-- Alle Termine sichtbarer Veranstaltungen: erster Termin und weitere Termine.
create view public.event_occurrences as
select
  e.id as event_id,
  e.slug,
  e.title_de,
  e.title_en,
  e.type_id,
  e.status,
  e.is_featured,
  e.starts_at,
  e.ends_at,
  e.show_time,
  false as is_cancelled,
  null::text as note_de,
  true as is_first
from public.events_public e
where e.starts_at is not null
union all
select
  e.id,
  e.slug,
  e.title_de,
  e.title_en,
  e.type_id,
  e.status,
  e.is_featured,
  d.starts_at,
  d.ends_at,
  e.show_time,
  d.is_cancelled,
  d.note_de,
  false
from public.event_dates d
join public.events_public e on e.id = d.event_id;

revoke all on public.event_occurrences from public, anon, authenticated;
grant select on public.event_occurrences to anon, authenticated;

-- Fotos folgen der Sichtbarkeit der Veranstaltung (event_is_public wurde oben erweitert).
create policy "event_photos: Event-Redakteur" on public.event_photos
  for all to authenticated
  using (public.is_event_editor())
  with check (public.is_event_editor());

-- ---------------------------------------------------------------------------
-- Anfragen zu Veranstaltungen
-- ---------------------------------------------------------------------------

alter table public.inquiries drop constraint if exists inquiries_type_check;
alter table public.inquiries add constraint inquiries_type_check
  check (type in ('werk', 'seminar', 'vortrag', 'kunstkurs', 'bentzel_club', 'kontakt', 'veranstaltung'));

alter table public.inquiries
  add column event_id uuid references public.events (id) on delete set null,
  add column persons integer check (persons between 1 and 100);

create index inquiries_event_idx on public.inquiries (event_id);

-- Öffentlich nur Einfügen. Eine Veranstaltung muss öffentlich sichtbar sein.
drop policy "inquiries: öffentlich einfügen" on public.inquiries;
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
    and (event_id is null or public.event_is_public(event_id))
  );

-- Event-Redakteure sehen und bearbeiten nur Anfragen zu Veranstaltungen.
create policy "inquiries: Event-Redakteur liest" on public.inquiries
  for select to authenticated
  using (public.is_event_editor() and event_id is not null);

create policy "inquiries: Event-Redakteur bearbeitet" on public.inquiries
  for update to authenticated
  using (public.is_event_editor() and event_id is not null)
  with check (public.is_event_editor() and event_id is not null);

create policy "registrations: Event-Redakteur" on public.registrations
  for all to authenticated
  using (public.is_event_editor())
  with check (public.is_event_editor());

-- ---------------------------------------------------------------------------
-- Statistik ohne Personenbezug
-- ---------------------------------------------------------------------------

create table public.event_stats (
  event_id uuid not null references public.events (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  detail_opens integer not null default 0,
  inquiry_clicks integer not null default 0,
  inquiries integer not null default 0,
  primary key (event_id, day)
);

alter table public.event_stats enable row level security;

create policy "event_stats: Event-Redakteur liest" on public.event_stats
  for select to authenticated
  using (public.is_event_editor());

-- Zählt ein Ereignis: view, detail, inquiry_click oder inquiry. Speichert keine Nutzerdaten.
create or replace function public.track_event_event(p_event uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('view', 'detail', 'inquiry_click', 'inquiry') then
    return;
  end if;
  if not public.event_is_public(p_event) then
    return;
  end if;
  insert into public.event_stats (event_id, day, views, detail_opens, inquiry_clicks, inquiries)
  values (
    p_event,
    current_date,
    (p_kind = 'view')::int,
    (p_kind = 'detail')::int,
    (p_kind = 'inquiry_click')::int,
    (p_kind = 'inquiry')::int
  )
  on conflict (event_id, day) do update set
    views = public.event_stats.views + excluded.views,
    detail_opens = public.event_stats.detail_opens + excluded.detail_opens,
    inquiry_clicks = public.event_stats.inquiry_clicks + excluded.inquiry_clicks,
    inquiries = public.event_stats.inquiries + excluded.inquiries;
end;
$$;

revoke all on function public.track_event_event(uuid, text) from public, anon, authenticated;
grant execute on function public.track_event_event(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Kurse werden Veranstaltungen der Art „Gruppenkurs“
-- ---------------------------------------------------------------------------

insert into public.events (
  slug, sort_order, is_published, title_de, title_en, description_de, description_en,
  starts_at, ends_at, location_name, capacity, price_eur, registration_open, type_id
)
select
  'kurs-' || substr(c.id::text, 1, 8), c.sort_order, c.is_published, c.title_de, c.title_en,
  c.description_de, c.description_en, c.starts_at, c.ends_at, c.location,
  nullif(c.capacity, 0), c.price_eur, c.registration_open,
  (select t.id from public.event_types t where t.slug = 'gruppenkurs')
from public.courses c;

drop table public.courses;

-- Bestehende Veranstaltungen ohne Art gelten als Event.
update public.events set type_id = (select t.id from public.event_types t where t.slug = 'event') where type_id is null;

-- ---------------------------------------------------------------------------
-- Speicher: Event-Redakteure verwalten nur den Bucket events
-- ---------------------------------------------------------------------------

create policy "storage: Event-Redakteur liest" on storage.objects
  for select to authenticated
  using (bucket_id = 'events' and public.is_event_editor());

create policy "storage: Event-Redakteur lädt hoch" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'events' and public.is_event_editor());

create policy "storage: Event-Redakteur ersetzt" on storage.objects
  for update to authenticated
  using (bucket_id = 'events' and public.is_event_editor())
  with check (bucket_id = 'events' and public.is_event_editor());

create policy "storage: Event-Redakteur löscht" on storage.objects
  for delete to authenticated
  using (bucket_id = 'events' and public.is_event_editor());

-- Veranstaltungen dürfen ein PDF mit weiteren Informationen haben.
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'application/pdf']
where id = 'events';
