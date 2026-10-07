# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 1, 4 Phasen, 33 Tasks, Gesamtgewicht 104).

## Aktive Phase

Phase 1: Fundament und öffentliche Seiten

## Aktive Aufgabe

Keine.

## Zuletzt abgeschlossen

task-2: Design-System. Fortschritt 6.73 % (2 von 33 Tasks).

## Bereite nächste Aufgaben

- task-3: Wiederverwendbare Komponenten
- task-4: Platzhalterdaten
- task-5: Header, Footer und Routing

## Blockiert

Nichts.

## Wichtige Entscheidungen

- Der Name des exklusiven Netzwerk-Kreises ist offen. Arbeitstitel „Bentzel Club“, Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Umsetzung zentral konfigurierbar.
- Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite gebaut statt in Lovable.
- Dashboards (Werke, Journal, Veranstaltungen) bleiben in Phase 2 (task-17 bis 19). task-4 bereitet die Datenstruktur dafür vor. Ein Supabase-Projekt ist bereits angelegt; Zugangsdaten gehören nur in `.env`, nie in den Chat.
- Linting mit oxlint (Vite-Standard) statt ESLint.

## Bekannte Probleme

- Der lokale Ordnerpfad enthält Doppelpunkte („Kunst 2024:25:26“). `npm run`-Skripte finden dadurch ihre Programme nicht, und der Vite-Dev-Server braucht `server.fs.strict: false`. Empfehlung: Projekt in einen Ordner ohne Doppelpunkte verschieben.

## Empfohlener nächster Schritt

task-4 (Platzhalterdaten) oder task-3 (Komponenten) auswählen.
