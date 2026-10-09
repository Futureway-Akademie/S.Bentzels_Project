# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 4, 4 Phasen, 42 Tasks, Gesamtgewicht 135).

## Aktive Phase

Phase 2: Datenbank und Dashboard (Phase 1 abgeschlossen)

## Aktive Aufgabe

Keine.

## Zuletzt abgeschlossen

task-32: Abschlussprüfung (davor task-35 Werkstatistik, task-27 SEO, task-28 Sitemap/robots/404, task-29 Rechtstexte und Preishinweise, task-30 Performance, task-31 Feinschliff, task-36 PDF-Werkblatt). Fortschritt 98.52 % (41 von 42 Tasks). Die verbleibenden Platzhalter stehen in `docs/placeholders.md`.

## Bereite nächste Aufgaben

- task-33: Domain und Launch (braucht den Nutzer: Domain, Resend, Supabase-Produktionsschritte)

## Blockiert

Nichts.

## Wichtige Entscheidungen

- Der Name des exklusiven Netzwerk-Kreises ist offen. Arbeitstitel „Bentzel Club“, Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Anzeigetexte stehen nur in `de.json` (`circle.*`), der URL-Pfad nur in `src/config/routes.ts`.
- Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite gebaut statt in Lovable. Linting mit oxlint (Vite-Standard) statt ESLint.
- Galerie-Prompt: Werkangaben bis auf das Bild optional, Bild zuerst im Werkdetail, globale Sichtbarkeitsschalter (Preis, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung), neue Tasks task-34 bis task-36. Fehlende oder ausgeblendete Angaben, auch der Preis, werden nicht angezeigt. Abschnitt 13 „Performance“ des Prompts lag nicht vor.
- Presse-Prompt: eigener Menüpunkt „Presse“ (Pressearchiv, Interessante Artikel), getrennt vom Journal, alle Angaben außer Datei oder Link optional, neue Tasks task-37 bis task-39. Der Prompt war nach Abschnitt 3 abgeschnitten. Rechte an gescannten Fremdartikeln sind vor der Veröffentlichung zu klären.
- Veranstaltungs-Prompt: ein gemeinsames Modul „Veranstaltungen“ (Seminar, Gruppenkurs, Workshop, Vorlesung, Event, Ausstellung, Kunstprojekt, erweiterbare Arten) ersetzt die getrennten Tabellen events und courses; nur der Titel ist Pflicht; mehrere Termine über event_dates; Anfragen mit event_id; anonyme Statistik; Rolle Event-Redakteur. Neue Tasks task-40 (Datenmodell), task-41 (öffentlicher Kalender), task-42 (Rollen und Statistik), task-19 neu zugeschnitten. Verbindliche Anmeldung, Warteliste und Zahlung bleiben vorbereitet, aber ungebaut.
- Dashboards (Werke, Journal, Veranstaltungen, Presse) gehören in Phase 2 (task-17 bis task-19, task-38, task-39).
- Datenbank: Werke werden öffentlich nur über die View `artworks_public` gelesen, Veranstaltungen nur über `events_public` und `event_occurrences` (ausgeblendete Angaben serverseitig leer). Anmeldungen sind nicht öffentlich einfügbar, sondern laufen über die Edge Function mit Kapazitätsprüfung (task-24).
- Bilder werden im Browser auf höchstens 2400 px verkleinert, als WebP gespeichert und erhalten eine 800-px-Vorschau. PDFs bleiben unverändert, die Vorschau entsteht aus der ersten Seite.
- Beiträge im Dashboard-Journal werden mit DOMPurify bereinigt (`src/lib/sanitizeHtml.ts`). Die öffentliche Beitragsseite verwendet sie (task-20).
- Schema (0001), Speicher (0002), Journal-Ergänzung (0003) und Veranstaltungsmodul (0004) sind im echten Supabase-Projekt „Kunst_Stephan_Bentzel“ (eu-central-1) eingespielt und geprüft (2026-10-08). Eine lokale `.env` mit Projekt-URL und öffentlichem Schlüssel existiert und ist von git ignoriert.

## Bekannte Probleme

- Migrationen 0005 bis 0009 sind seit 2026-10-08 im echten Supabase-Projekt eingespielt und geprüft. Die vier Edge Functions `submit-inquiry`, `register-event`, `cancel-registration` und `sitemap` sind seit 2026-10-08 dort deployt (über den Dashboard-Editor aus gebündelten Einzeldateien, Verify JWT aus, Antworten auf ungültige Eingaben geprüft). Es fehlen noch die Secrets RESEND_API_KEY, IP_SALT und TOKEN_SECRET (ohne sie gelten unsichere Standardwerte und es werden keine E-Mails versendet) sowie ein echter Test mit Versand (Anleitung in `docs/SUPABASE_SETUP.md`, Abschnitte 1e bis 1g, Bildgrößen und Sitemap).  Wichtig: Seit 0006 können Anfragen nur noch über `submit-inquiry` gespeichert werden, bis zum Deploy lassen sich im Livebetrieb keine Anfragen senden (Formulare zeigen den E-Mail-Hinweis). Bis dahin lassen sich Anfragen dort nicht senden (die Formulare zeigen den Hinweis mit E-Mail-Link). Für den Versand braucht es ein Resend-Konto mit verifizierter Domain und die Secrets (Anleitung `docs/SUPABASE_SETUP.md`, Abschnitt 1g). Wichtig: Migration 0006 verbietet das direkte Schreiben von Anfragen, sie sollte erst mit der Funktion zusammen eingespielt werden.
- Beispieldaten (`supabase/seed.sql`) sind seit 2026-10-08 im echten Supabase-Projekt eingespielt (10 Werke, 44 Vita-Einträge, 2 Beiträge, 6 Veranstaltungen, 6 Presseeinträge, 3 Artikel). Sie enthalten graue Platzhalterbilder und Beispieltexte („Beispiel: …“, example.com-Links) und müssen vor dem Launch im Dashboard ersetzt oder gelöscht werden.
- Das Dashboard (Werke, Journal, Vita, Veranstaltungen) wurde bisher nur gegen einen lokalen Ersatz getestet, nie gegen das echte Supabase-Projekt. Touch-Bedienung und Bildschirmleser sind nicht geprüft.
- Event-Redakteure (Rolle `event_editor`) sehen im Dashboard nur Veranstaltungen, Statistik und Eingänge (Anleitung in `docs/SUPABASE_SETUP.md`).
- Supabase, offene Schritte für den Nutzer (siehe `docs/SUPABASE_SETUP.md`): (1) „Allow new users to sign up“ unter Authentication > Sign In / Providers ausschalten (derzeit noch offen), (2) Admin-Konto mit E-Mail und Passwort anlegen (Authentication > Users > Add user, Auto Confirm), (3) die E-Mail in die Tabelle `admins` eintragen (eine SQL-Zeile). Bis dahin ist die Anmeldung im Dashboard nicht nutzbar, und die echte Anmeldung wurde noch nie getestet (bisher nur gegen einen lokalen Ersatz).
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament (task-10) sind Entwürfe und fachlich zu prüfen.
- Der lokale Ordnerpfad enthält Doppelpunkte („Kunst 2024:25:26“). `npm run`-Skripte finden dadurch ihre Programme nicht, und der Vite-Dev-Server braucht `server.fs.strict: false`. Empfehlung: Projekt in einen Ordner ohne Doppelpunkte verschieben.
- Alle Änderungen seit task-17 sind lokal und noch nicht gepusht.

- Nicht bestätigt: Lighthouse-Werte (Ziel über 90) konnten nicht gemessen werden (Anleitung in `docs/architecture.md`, Abschnitt Performance). Wischgesten der Großansicht wurden nur mit simulierten Touch-Ereignissen geprüft, das PDF-Werkblatt nur als Bild der ersten Seite.
- Rechtstexte (Impressum, Datenschutz) sind nur Vorlagen und müssen rechtlich geprüft werden. Startseiten- und Künstlerbilder sind fest im Code als Platzhalter hinterlegt (`docs/placeholders.md`).
- Neue Abhängigkeit: `pdf-lib` (PDF-Werkblatt, wird beim Klick nachgeladen).

## Empfohlener nächster Schritt

Die Betriebsschritte im echten Projekt erledigen (siehe Bekannte Probleme und `docs/SUPABASE_SETUP.md`: Migrationen 0005 bis 0009 und Beispieldaten einspielen, vier Edge Functions deployen, Resend, Registrierung ausschalten, Admin-Konto anlegen), dann task-33 (Domain und Launch).
