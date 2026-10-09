-- Anfragen nur noch über die Edge Function (task-22)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0005). Details: docs/SUPABASE_SETUP.md
--
-- Bisher durften Besucher Anfragen direkt in die Tabelle schreiben. Jetzt prüft die Edge Function
-- submit-inquiry jede Anfrage (zod, Köderfeld, Mindestausfüllzeit, Begrenzung je Absender),
-- speichert sie mit dem service_role-Schlüssel und verschickt die E-Mails. Direktes Schreiben
-- ist deshalb nicht mehr erlaubt.

drop policy if exists "inquiries: öffentlich einfügen" on public.inquiries;

-- Zeitpunkt der Zustimmung zur Datenschutzerklärung
alter table public.inquiries add column if not exists consent_at timestamptz;

-- Zähler für die Begrenzung je Absender. Der Schlüssel ist ein Hash, die Adresse selbst wird nie
-- gespeichert. Kein öffentlicher Zugriff, nur die Edge Function (service_role) liest und schreibt.
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null check (count >= 0),
  window_start timestamptz not null
);

alter table public.rate_limits enable row level security;
