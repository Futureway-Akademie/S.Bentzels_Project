# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 1, 4 Phasen, 33 Tasks, Gesamtgewicht 104).

## Aktive Phase

Phase 1: Fundament und öffentliche Seiten

## Aktive Aufgabe

Keine. Vom Nutzer gewünschte Reihenfolge: task-8, task-9, task-10.

## Zuletzt abgeschlossen

task-7: Künstlerseite. Fortschritt 21.15 % (7 von 33 Tasks).

## Bereite nächste Aufgaben

- task-8: Galerie und Werkdetail
- task-9: Seminare, Kunstkurse und Vorträge
- task-10: The Art of Becoming
- task-11: Netzwerk, Veranstaltungsdetail und Club-Seite (Arbeitstitel „Bentzel Club“, endgültiger Name offen)
- task-12: Journal, Kontakt und Rechtsseiten

Nichts.

## Wichtige Entscheidungen

- Der Name des exklusiven Netzwerk-Kreises ist offen. Arbeitstitel „Bentzel Club“, Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Umsetzung zentral konfigurierbar.
- Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite gebaut statt in Lovable.
- Dashboards (Werke, Journal, Veranstaltungen) bleiben in Phase 2 (task-17 bis 19). task-4 bereitet die Datenstruktur dafür vor. Ein Supabase-Projekt ist bereits angelegt; Zugangsdaten gehören nur in `.env`, nie in den Chat.
- Linting mit oxlint (Vite-Standard) statt ESLint.

## Bekannte Probleme

- Der lokale Ordnerpfad enthält Doppelpunkte („Kunst 2024:25:26“). `npm run`-Skripte finden dadurch ihre Programme nicht, und der Vite-Dev-Server braucht `server.fs.strict: false`. Empfehlung: Projekt in einen Ordner ohne Doppelpunkte verschieben.

## Empfohlener nächster Schritt

task-8 (Galerie und Werkdetail) auswählen.
