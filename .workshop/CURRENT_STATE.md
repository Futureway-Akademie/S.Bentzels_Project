# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 5, 5 Phasen, 49 Tasks, Gesamtgewicht 152).

## Aktive Phase

Phase 5: Inhalte, Prüfung und Betrieb (Phasen 1 bis 4 abgeschlossen, Website live).

## Aktive Aufgabe

Keine.

## Zuletzt abgeschlossen

task-33: Domain und Launch (2026-10-09). Die Website ist live unter https://www.sturmfederprojects.de (STRATO Hosting Starter, Webspace-Ordner `/sturmfederprojects.de`, Inklusiv-SSL, `.htaccess` erzwingt https und www). sturmfederprojects.eu leitet per 301 dorthin. Resend-Domain verifiziert, Livetest des Kontaktformulars mit Zustellung beider E-Mails. Fortschritt nach Erweiterung der Roadmap 88.82 % (42 von 49 Tasks).

## Bereite nächste Aufgaben

- task-43: Echte Inhalte statt Beispieldaten
- task-44: Feste Bilder und Texte im Code ersetzen
- task-45: Name des Netzwerk-Kreises
- task-46: Live-Test aller Formulare und des Dashboards
- task-48: Rechtliche und fachliche Prüfung
- task-49: Hosting und Betrieb aufräumen
- Geplant: task-47 Lighthouse-Messung und Optimierung (nach task-43 und task-44)

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

- Betrieb im echten Supabase-Projekt (Stand 2026-10-09): Migrationen 0001 bis 0009 und Beispieldaten eingespielt, vier Edge Functions deployt, Secrets IP_SALT, TOKEN_SECRET, RESEND_API_KEY, NOTIFY_TO (stephan.bentzel@viqua.de), SITE_URL und MAIL_FROM (info@sturmfederprojects.de) gesetzt. Admin-Konto angelegt, in `admins` eingetragen, echter Login erfolgreich. „Allow new users to sign up“ ist aus.
- Live nur `submit-inquiry` (Kontakt) mit Versand getestet. Werk-, Seminar-, Vortrags- und Veranstaltungsformulare, Anmeldung und Stornierung sind im Livebetrieb nicht geprüft. Die Testanfrage „Launch-Test (Claude)“ steht in den Eingängen.
- Beispieldaten (`supabase/seed.sql`) sind live (10 Werke, 44 Vita-Einträge, 2 Beiträge, 6 Veranstaltungen, 6 Presseeinträge, 3 Artikel) mit grauen Platzhalterbildern und Beispieltexten („Beispiel: …“, example.com-Links). Sie müssen im Dashboard ersetzt oder gelöscht werden.
- Das Dashboard wurde nur gegen einen lokalen Ersatz ausführlich getestet; gegen das echte Projekt nur der Login. Touch-Bedienung und Bildschirmleser sind nicht geprüft.
- Event-Redakteure (Rolle `event_editor`) sehen im Dashboard nur Veranstaltungen, Statistik und Eingänge (Anleitung in `docs/SUPABASE_SETUP.md`).
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament (task-10) sind Entwürfe und fachlich zu prüfen.
- Hosting: Deploy per ZIP-Upload im STRATO-Webspace-Dateimanager und „Entpacken“ in `/sturmfederprojects.de`; Build mit `VITE_SITE_URL=https://www.sturmfederprojects.de`. `site.zip` liegt noch öffentlich im Webspace-Ordner und sollte gelöscht werden. sturmfederprojects.eu hat kein SSL-Zertifikat (nur http-Weiterleitung). STRATO hat den Mailversand aus den Paket-Postfächern gesperrt (betrifft Resend nicht).
- Das Projekt liegt jetzt unter `Kunst_2024-25-26` (ohne Doppelpunkte), `npm run` funktioniert dort.

- Nicht bestätigt: Lighthouse-Werte (Ziel über 90) konnten nicht gemessen werden (Anleitung in `docs/architecture.md`, Abschnitt Performance). Wischgesten der Großansicht wurden nur mit simulierten Touch-Ereignissen geprüft, das PDF-Werkblatt nur als Bild der ersten Seite.
- Rechtstexte (Impressum, Datenschutz) sind nur Vorlagen und müssen rechtlich geprüft werden. Startseiten- und Künstlerbilder sind fest im Code als Platzhalter hinterlegt (`docs/placeholders.md`).
- Neue Abhängigkeit: `pdf-lib` (PDF-Werkblatt, wird beim Klick nachgeladen).

## Empfohlener nächster Schritt

task-46 (Live-Test aller Formulare) ist ohne Zuarbeit des Nutzers möglich. task-43, task-44, task-45 und task-48 brauchen Inhalte oder Entscheidungen des Nutzers.
