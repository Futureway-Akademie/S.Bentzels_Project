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

## 1c. Ergänzung für das Journal (task-18)

Im **SQL Editor** eine weitere **New query** öffnen, den gesamten Inhalt der Datei `supabase/migrations/0003_posts_cover_thumb.sql` einfügen und **Run** drücken (nach Schritt 1 und 1b). Sie fügt das Vorschaubild des Titelbildes hinzu. Ohne diese Datei lässt sich das Journal im Dashboard nicht öffnen.

## 1d. Ergänzung für das Veranstaltungsmodul (task-40)

Im **SQL Editor** eine weitere **New query** öffnen, den gesamten Inhalt der Datei `supabase/migrations/0004_events_module.sql` einfügen und **Run** drücken (nach Schritt 1, 1b und 1c). Sie baut Veranstaltungen zu einem gemeinsamen Modul für Seminare, Kurse, Workshops, Vorlesungen und Events aus, überführt vorhandene Kurse und fügt die Rolle Event-Redakteur hinzu. **Die Datei muss vor der ersten Anmeldung im Dashboard eingespielt sein**, denn das Dashboard liest jetzt die Rolle aus der Tabelle `admins`.

## 1e. Ergänzung für das Pressearchiv (task-38)

Im **SQL Editor** eine weitere **New query** öffnen, den gesamten Inhalt der Datei `supabase/migrations/0005_press_categories.sql` einfügen und **Run** drücken (nach den Schritten 1 bis 1d). Sie legt eine Tabelle für die Presse-Kategorien an (die fünf bisherigen Kategorien werden übernommen), die im Dashboard verwaltet werden kann. Ohne diese Datei lässt sich das Presse-Modul im Dashboard nicht öffnen.

## 1f. Beispieldaten einspielen (optional)

Damit die Website nicht leer wirkt, enthält `supabase/seed.sql` Beispielinhalte: zehn Werke und zwei Beiträge mit grauen Bildplatzhaltern, vier Netzwerk-Abende und zwei Kurse, Pressebeispiele, drei empfohlene Artikel und die Vita. Im **SQL Editor** eine weitere **New query** öffnen, den gesamten Inhalt der Datei einfügen und **Run** drücken (nach den Schritten 1 bis 1e). Die Datei darf mehrfach ausgeführt werden und fügt nichts doppelt ein. Alle Beispieltexte außer der Vita ersetzen oder löschen Sie anschließend im Dashboard.

## 1g. Anfragen und E-Mails (Edge Function)

Alle Formulare der Website senden an die Edge Function `submit-inquiry`. Sie prüft die Eingaben, schützt vor Spam, speichert die Anfrage in `inquiries` und verschickt zwei E-Mails über Resend: eine Benachrichtigung an den Künstler (Antwort-Adresse ist der Absender) und eine Eingangsbestätigung an den Absender.

**Schritt 1: Datenbank.** Im **SQL Editor** den Inhalt von `supabase/migrations/0006_inquiry_protection.sql` einspielen. Danach können Besucher Anfragen nicht mehr direkt in die Tabelle schreiben, sondern nur noch über die Funktion.

**Schritt 2: Resend.** Ein Konto bei Resend anlegen und die Domain `sturmfederprojects.de` verifizieren. Den API-Schlüssel tragen Sie nur als Secret ein (siehe Schritt 3), nie im Chat, im Code oder in einer Datei im Projekt.

**Schritt 3: Secrets und Funktion** (im Projektordner, einmalig `supabase login` und `supabase link --project-ref <Projektkennung>`):

```bash
supabase secrets set RESEND_API_KEY=… IP_SALT=<lange zufällige Zeichenfolge>
supabase secrets set NOTIFY_TO=stephan.bentzel@viqua.de ALLOWED_ORIGIN=https://www.sturmfederprojects.de
supabase functions deploy submit-inquiry --import-map supabase/functions/import_map.json --no-verify-jwt
```

`NOTIFY_TO` (Standard `stephan.bentzel@viqua.de`), `MAIL_FROM` (Standard `Stephan Graf Bentzel-Sturmfeder <info@sturmfederprojects.de>`), `SITE_NAME` und `CIRCLE_NAME` (Standard „Bentzel Club“, bis der Name des Kreises feststeht) sind optional. `--no-verify-jwt` ist nötig, damit Besucher ohne Anmeldung senden können. Der Spamschutz übernimmt die Funktion selbst.

**Schritt 4: Testen.** Auf der Website `/kontakt` eine Nachricht senden. Es erscheint die Bestätigung, in `inquiries` steht ein Eintrag und beide E-Mails kommen an. Bei einer Störung sieht der Besucher einen Hinweis mit E-Mail-Link, die Anfrage geht nicht verloren, sobald sie gespeichert ist.

### Verbindliche Veranstaltungsanmeldung (task-24)

Für Veranstaltungen mit der Art „Verbindliche Anmeldung“ (im Dashboard bei der Veranstaltung) gibt es eine zweite Funktion, `register-event`:

1. Im **SQL Editor** den Inhalt von `supabase/migrations/0007_event_registration.sql` einspielen.
2. Ein weiteres Secret setzen und die Funktion deployen:

```bash
supabase secrets set TOKEN_SECRET=<lange zufällige Zeichenfolge> SITE_URL=https://www.sturmfederprojects.de
supabase functions deploy register-event --import-map supabase/functions/import_map.json --no-verify-jwt
```

Die Funktion prüft die Kapazität in der Datenbank atomar (Begleitpersonen zählen mit), setzt bei einer vollen Veranstaltung automatisch auf die Warteliste, führt freie Plätze und Status nach (voll = „Ausgebucht“, ein Viertel oder weniger frei = „Wenige Plätze verfügbar“) und schickt dem Gast eine Bestätigung mit Termin als `.ics`-Anhang und persönlichem Stornierungslink, bei der Warteliste einen eigenen Text. Der Künstler erhält jeweils eine Mitteilung. Bei einer Veranstaltung ohne maximale Teilnehmerzahl sind immer alle angemeldet. Auf der Veranstaltungsseite erscheint „Noch X Plätze frei“ ab weniger als 10 freien Plätzen. Ist die Anmeldung geschlossen, abgesagt, vorbei oder die Frist abgelaufen, erscheint kein Formular.

### Stornierung und Nachrücken (task-25)

Jede Bestätigungs-E-Mail enthält einen persönlichen Stornierungslink (`/abmelden?token=…`, mit geheimem Schlüssel signiert). Die Seite storniert erst nach einem Klick auf „Anmeldung stornieren“, damit das bloße Öffnen oder Vorladen des Links durch ein Mailprogramm nichts auslöst.

1. Im **SQL Editor** den Inhalt von `supabase/migrations/0008_registration_cancellation.sql` einspielen.
2. Die dritte Funktion deployen (`TOKEN_SECRET` muss derselbe Wert sein wie bei `register-event`):

```bash
supabase functions deploy cancel-registration --import-map supabase/functions/import_map.json --no-verify-jwt
```

Bei einer Stornierung wird der Status „storniert“, freie Plätze und Status der Veranstaltung werden nachgeführt, der Künstler und die stornierende Person erhalten eine E-Mail, und Personen von der Warteliste rücken in der Reihenfolge ihrer Anmeldung nach, solange ihre Personenzahl (mit Begleitung) in die freien Plätze passt. Wer nachrückt, erhält eine Bestätigung mit Termin (`.ics`) und neuem Stornierungslink. Wer nicht passt, bleibt auf der Warteliste, die Nächsten rücken trotzdem nach. Eine Stornierung von der Warteliste lässt niemanden nachrücken.

**Spamschutz:** verstecktes Köderfeld und Mindestausfüllzeit von 3 Sekunden (beides verwirft die Funktion stillschweigend), höchstens 5 Anfragen je Stunde und Absender (anonymer Hash der Adresse, Tabelle `rate_limits`). Es werden keine Cookies und keine externen Dienste verwendet.

### Bildgrößen (task-30)

Migration `supabase/migrations/0009_image_variants.sql` im **SQL Editor** einspielen (nach 0001 bis 0008). Sie ergänzt die Spalte `image_variants` bei Werken und weiteren Werkbildern und gibt sie über `artworks_public` frei. Neu hochgeladene Werkbilder erhalten automatisch zusätzliche Fassungen mit 800 und 1600 px (nur wenn das Bild größer ist), der Browser wählt je Bildschirm die passende. Ältere Bilder haben keine Fassungen und funktionieren unverändert; wer sie nachträglich beschleunigen will, ersetzt das Hauptbild im Dashboard einmal. Ohne die Migration schlägt das Hochladen neuer Werkbilder im Dashboard fehl (die Spalte fehlt).

### Sitemap (task-28)

Die Funktion `sitemap` liefert die Sitemap (XML) aus den veröffentlichten Werken, Beiträgen und Veranstaltungen. Sie braucht keine eigenen Secrets (optional `SITE_URL`, die öffentliche Adresse der Website).

```bash
supabase functions deploy sitemap --import-map supabase/functions/import_map.json --no-verify-jwt
```

Die Adresse lautet `https://<projekt>.supabase.co/functions/v1/sitemap`. Damit sie unter `https://<domain>/sitemap.xml` erreichbar ist, beim Hosting (Launch, task-33) eine Weiterleitung („Rewrite“, nicht „Redirect“) von `/sitemap.xml` auf diese Adresse einrichten. Beim Bauen die Variable `VITE_SITE_URL` setzen: Dann steht die Sitemap-Zeile automatisch in der `robots.txt`.

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

Nur Konten in der Tabelle `admins` dürfen später Inhalte ändern. Ein Konto mit der Rolle `event_editor` (Event-Redakteur) darf nur Veranstaltungen, Termine, Anfragen zu Veranstaltungen und die Veranstaltungsstatistik verwalten (siehe unten). Ein eingeloggtes Konto ohne diesen Eintrag hat keine Rechte.

### Event-Redakteur anlegen (optional)

Wer nur Veranstaltungen pflegen soll, erhält ein eigenes Konto: wie in Schritt 3 unter **Authentication** > **Users** anlegen (Auto Confirm) und dann im **SQL Editor** eintragen (E-Mail ersetzen):

```sql
insert into public.admins (user_id, role)
select id, 'event_editor' from auth.users where email = 'redakteur@email.de';
```

Der Redakteur sieht im Dashboard nur Veranstaltungen, Statistik und Eingänge. Werke, Journal, Vita, Presse und Einstellungen bleiben Administratoren vorbehalten, auch wenn er die Adresse direkt aufruft. Die Datenbank erzwingt diese Grenzen selbst.

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
