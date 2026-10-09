-- Verbindliche Anmeldung zu Veranstaltungen (task-24)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0006). Details: docs/SUPABASE_SETUP.md
--
-- Die Anmeldung läuft über die Edge Function register-event. Die Kapazitätsprüfung geschieht
-- hier in der Datenbank in einem Schritt (Zeile der Veranstaltung gesperrt), damit zwei
-- gleichzeitige Anmeldungen nie mehr Plätze vergeben als vorhanden sind. Begleitpersonen zählen
-- mit. Ist die Veranstaltung voll, landet die Anmeldung automatisch auf der Warteliste.

-- Persönliche Kennung für den Stornierungslink (nicht erratbar)
alter table public.registrations add column if not exists cancel_key uuid not null default gen_random_uuid();
create unique index if not exists registrations_cancel_key_idx on public.registrations (cancel_key);
alter table public.registrations add column if not exists cancelled_at timestamptz;
alter table public.registrations add column if not exists consent_at timestamptz;

-- Belegte Plätze: alle Personen (Anmeldung plus Begleitung) mit Status „angemeldet“
create or replace function public.event_seats_taken(p_event uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(1 + r.guests), 0)::integer
  from public.registrations r
  where r.event_id = p_event and r.status = 'angemeldet';
$$;

revoke all on function public.event_seats_taken(uuid) from public, anon, authenticated;
grant execute on function public.event_seats_taken(uuid) to service_role;

-- Gleicht freie Plätze und Status einer Veranstaltung mit den Anmeldungen ab. Ohne Kapazität
-- bleibt alles unverändert. Manuelle Status wie „verschoben“ oder „abgesagt“ bleiben erhalten.
create or replace function public.sync_event_seats(p_event uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_left integer;
begin
  select * into v_event from public.events where id = p_event;
  if not found or v_event.capacity is null then
    return;
  end if;
  v_left := greatest(0, v_event.capacity - public.event_seats_taken(p_event));
  update public.events
  set places_available = v_left,
      status = case
        when status not in ('geplant', 'anmeldung_moeglich', 'wenige_plaetze', 'ausgebucht') then status
        when v_left = 0 then 'ausgebucht'
        when v_left <= greatest(1, ceil(capacity * 0.25)) then 'wenige_plaetze'
        else 'anmeldung_moeglich'
      end
  where id = p_event;
end;
$$;

revoke all on function public.sync_event_seats(uuid) from public, anon, authenticated;
grant execute on function public.sync_event_seats(uuid) to service_role;

-- Meldet eine Person an. Fehler: unknown_event, closed (nicht freigegeben, geschlossen, abgesagt,
-- vorbei, Frist abgelaufen), duplicate (diese E-Mail ist schon angemeldet oder auf der Warteliste).
create or replace function public.register_for_event(
  p_event uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_company text,
  p_guests integer
)
returns table (registration_id uuid, cancel_key uuid, status text, seats_left integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_persons integer := 1 + greatest(0, coalesce(p_guests, 0));
  v_status text;
  v_id uuid;
  v_key uuid;
begin
  select * into v_event from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'unknown_event';
  end if;
  if not v_event.is_published
     or not v_event.registration_open
     or v_event.registration_mode <> 'verbindlich'
     or v_event.status in ('abgesagt', 'beendet', 'archiviert')
     or (v_event.registration_deadline is not null and v_event.registration_deadline < now())
     or coalesce(v_event.ends_at, v_event.starts_at, now()) < now() then
    raise exception 'closed';
  end if;
  if exists (
    select 1 from public.registrations r
    where r.event_id = p_event and lower(r.email) = lower(p_email) and r.status in ('angemeldet', 'warteliste')
  ) then
    raise exception 'duplicate';
  end if;

  if v_event.capacity is null or public.event_seats_taken(p_event) + v_persons <= v_event.capacity then
    v_status := 'angemeldet';
  else
    v_status := 'warteliste';
  end if;

  insert into public.registrations (event_id, name, email, phone, company, guests, status, consent_at)
  values (p_event, p_name, p_email, nullif(p_phone, ''), nullif(p_company, ''), greatest(0, coalesce(p_guests, 0)), v_status, now())
  returning id, public.registrations.cancel_key into v_id, v_key;

  perform public.sync_event_seats(p_event);

  return query
    select v_id, v_key, v_status,
           case when v_event.capacity is null then null else greatest(0, v_event.capacity - public.event_seats_taken(p_event)) end;
end;
$$;

revoke all on function public.register_for_event(uuid, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, text, text, integer) to service_role;
