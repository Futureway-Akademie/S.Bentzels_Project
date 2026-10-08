# Supabase einrichten

Diese Anleitung verbindet die Website mit deinem Supabase-Projekt (Region EU Central, Frankfurt). Du brauchst dafür keine Programmierkenntnisse. Alle Schritte machst du selbst im Supabase Dashboard, Passwörter und Schlüssel gehören nie in den Chat.

## 1. Datenbank anlegen

1. Im Supabase Dashboard dein Projekt öffnen und links **SQL Editor** wählen.
2. **New query** wählen, den gesamten Inhalt der Datei `supabase/migrations/0001_schema.sql` einfügen und **Run** drücken.
3. Es erscheint „Success“. Unter **Table Editor** sind jetzt die Tabellen sichtbar (artworks, events, posts, press_items, inquiries und weitere).

Die Datei darf nur **einmal** ausgeführt werden. Bei einer Fehlermeldung „already exists“ wurde sie schon eingespielt.

## 1b. Speicher für Bilder und PDFs anlegen

1. Im **SQL Editor** eine weitere **New query** öffnen, den gesamten Inhalt der Datei `supabase/migrations/0002_storage.sql` einfügen und **Run** drücken (erst nach Schritt 1).
2. Unter **Storage** sind jetzt die Buckets `artworks`, `posts`, `events`, `people` und `press` sichtbar. Sie sind öffentlich lesbar, hochladen und löschen dürfen nur Admins. Erlaubt sind nur Bilder (JPEG, PNG, WebP), im Bucket `press` zusätzlich PDF.

## 2. Öffentliche Registrierung ausschalten

Es soll sich niemand selbst ein Konto anlegen können.

1. **Authentication** > **Sign In / Providers** (oder **Providers**) > **Email**.
2. **Allow new users to sign up** ausschalten und speichern.

## 3. Deinen Admin-Zugang anlegen

1. **Authentication** > **Users** > **Add user** > **Create new user**.
2. E-Mail und ein langes, eigenes Passwort eintragen. **Auto Confirm User** aktivieren und anlegen.
3. Im **SQL Editor** diese Zeile ausführen (die E-Mail-Adresse durch deine ersetzen):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'deine@email.de';
```

Nur Konten in der Tabelle `admins` dürfen später Inhalte ändern. Ein eingeloggtes Konto ohne diesen Eintrag hat keine Rechte.

## 4. Website mit Supabase verbinden

1. Im Supabase Dashboard **Project Settings** > **API** öffnen.
2. Die Datei `.env.example` im Projektordner als `.env` kopieren und ausfüllen:
   - `VITE_SUPABASE_URL`: die **Project URL**
   - `VITE_SUPABASE_ANON_KEY`: der **anon public**-Schlüssel
3. **Niemals** den `service_role`-Schlüssel eintragen. Die Datei `.env` wird nicht ins Repository übernommen.

## 5. Testen

1. Die Website lokal starten und `/admin/login` öffnen.
2. Mit E-Mail und Passwort aus Schritt 3 anmelden. Es erscheint der Verwaltungsbereich mit deiner E-Mail.
3. Ein nicht in `admins` eingetragenes Konto sieht nach der Anmeldung nur „kein Zugriff“.

## Für Entwickler

- Das Schema und die Sicherheitsregeln lassen sich ohne Supabase-Konto in einer lokalen PostgreSQL-Datenbank prüfen: `node supabase/tests/schema.test.mjs`
- Öffentlich lesbar sind nur veröffentlichte Inhalte. Werke werden über die View `artworks_public` gelesen, ausgeblendete Angaben (Tabelle `site_settings`, Schlüssel `gallery_visibility`) sind dort serverseitig leer.
- Anfragen (`inquiries`) dürfen öffentlich nur eingefügt werden. Anmeldungen (`registrations`) schreibt später die Edge Function mit dem `service_role`-Schlüssel, damit die Kapazität serverseitig geprüft wird.
- Schema-Änderungen kommen als neue, fortlaufend nummerierte Dateien in `supabase/migrations/`. Die Dateien werden der Reihe nach eingespielt.
- Bilder werden im Browser auf höchstens 2400 px verkleinert, als WebP gespeichert und erhalten eine Vorschau mit höchstens 800 px. PDFs bleiben unverändert, die Vorschau entsteht aus der ersten Seite (Code in `src/admin/lib/`).
- Tests ohne Supabase-Konto: `node supabase/tests/schema.test.mjs` (Datenbank und Speicherregeln) und `node --test src/admin/lib/imageMath.test.ts` (Bildrechnung und Adressen).
