# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 3, 4 Phasen, 39 Tasks, Gesamtgewicht 124).

## Aktive Phase

Phase 2: Datenbank und Dashboard (Phase 1 abgeschlossen)

## Aktive Aufgabe

Keine.

## Zuletzt abgeschlossen

task-17: Dashboard-Modul Werke. Fortschritt 47.58 % (18 von 39 Tasks).

## Bereite nächste Aufgaben

- task-18: Dashboard-Module Journal und Vita
- task-19: Dashboard-Module Veranstaltungen und Kunstkurse
- task-34: Globale Sichtbarkeitsschalter
- task-38: Dashboard: Presse
- task-39: Dashboard: Interessante Artikel

## Blockiert

Nichts.

## Wichtige Entscheidungen

- Der Name des exklusiven Netzwerk-Kreises ist offen. Arbeitstitel „Bentzel Club“, Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Anzeigetexte stehen nur in `de.json` (`circle.*`), der URL-Pfad nur in `src/config/routes.ts`.
- Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite gebaut statt in Lovable. Linting mit oxlint (Vite-Standard) statt ESLint.
- Galerie-Prompt: Werkangaben bis auf das Bild optional, Bild zuerst im Werkdetail, globale Sichtbarkeitsschalter (Preis, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung), neue Tasks task-34 bis task-36. Fehlende oder ausgeblendete Angaben, auch der Preis, werden nicht angezeigt. Abschnitt 13 „Performance“ des Prompts lag nicht vor.
- Presse-Prompt: eigener Menüpunkt „Presse“ (Pressearchiv, Interessante Artikel), getrennt vom Journal, alle Angaben außer Datei oder Link optional, neue Tasks task-37 bis task-39. Der Prompt war nach Abschnitt 3 abgeschnitten. Rechte an gescannten Fremdartikeln sind vor der Veröffentlichung zu klären.
- Dashboards (Werke, Journal, Veranstaltungen, Presse) gehören in Phase 2 (task-17 bis task-19, task-38, task-39).
- Datenbank: Werke werden öffentlich nur über die View `artworks_public` gelesen (ausgeblendete Angaben serverseitig leer). Anmeldungen sind nicht öffentlich einfügbar, sondern laufen über die Edge Function mit Kapazitätsprüfung (task-24).
- Bilder werden im Browser auf höchstens 2400 px verkleinert, als WebP gespeichert und erhalten eine 800-px-Vorschau. PDFs bleiben unverändert, die Vorschau entsteht aus der ersten Seite.
- Schema (0001) und Speicher (0002) sind im echten Supabase-Projekt „Kunst_Stephan_Bentzel“ (eu-central-1) eingespielt und geprüft (2026-10-08). Eine lokale `.env` mit Projekt-URL und öffentlichem Schlüssel existiert und ist von git ignoriert.

## Bekannte Probleme

- Supabase, offene Schritte für den Nutzer (siehe `docs/SUPABASE_SETUP.md`): (1) „Allow new users to sign up“ unter Authentication > Sign In / Providers ausschalten (derzeit noch offen), (2) Admin-Konto mit E-Mail und Passwort anlegen (Authentication > Users > Add user, Auto Confirm), (3) die E-Mail in die Tabelle `admins` eintragen (eine SQL-Zeile). Bis dahin ist die Anmeldung im Dashboard nicht nutzbar, und die echte Anmeldung wurde noch nie getestet (bisher nur gegen einen lokalen Ersatz).
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament (task-10) sind Entwürfe und fachlich zu prüfen.
- Der lokale Ordnerpfad enthält Doppelpunkte („Kunst 2024:25:26“). `npm run`-Skripte finden dadurch ihre Programme nicht, und der Vite-Dev-Server braucht `server.fs.strict: false`. Empfehlung: Projekt in einen Ordner ohne Doppelpunkte verschieben.

## Empfohlener nächster Schritt

Registrierung ausschalten und Admin-Konto anlegen (siehe Bekannte Probleme), dann die echte Anmeldung und das Werke-Modul im echten Projekt prüfen. Danach task-18 (Journal und Vita), task-19 (Veranstaltungen und Kunstkurse), task-34, task-38 oder task-39 auswählen.
