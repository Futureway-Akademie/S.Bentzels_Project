# Aktueller Projektstand

## Projekt

Website Stephan Graf Bentzel-Sturmfeder (Roadmap Version 2, 4 Phasen, 36 Tasks, Gesamtgewicht 113).

## Aktive Phase

Phase 1: Fundament und öffentliche Seiten

## Aktive Aufgabe

Keine. Vom Nutzer gewünschte Reihenfolge: task-9, dann task-10.

## Zuletzt abgeschlossen

task-8: Galerie und Werkdetail. Fortschritt 23.01 % (8 von 36 Tasks).

## Bereite nächste Aufgaben

- task-9: Seminare, Kunstkurse und Vorträge
- task-10: The Art of Becoming
- task-11: Netzwerk, Veranstaltungsdetail und Club-Seite (Arbeitstitel „Bentzel Club“, endgültiger Name offen)
- task-12: Journal, Kontakt und Rechtsseiten

Nichts.

## Wichtige Entscheidungen

- Der Name des exklusiven Netzwerk-Kreises ist offen. Arbeitstitel „Bentzel Club“, Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Umsetzung zentral konfigurierbar.
- Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite gebaut statt in Lovable.
- Dashboards (Werke, Journal, Veranstaltungen) bleiben in Phase 2 (task-17 bis 19). task-4 bereitet die Datenstruktur dafür vor. Ein Supabase-Projekt ist bereits angelegt; Zugangsdaten gehören nur in `.env`, nie in den Chat.
- Galerie-Prompt: Werkangaben bis auf das Bild optional, Bild zuerst im Werkdetail, globale Sichtbarkeitsschalter, neue Tasks task-34 (Sichtbarkeitsschalter), task-35 (Werkstatistik), task-36 (PDF-Werkblatt). Abschnitt 13 „Performance“ des Prompts lag nicht vor.
- Linting mit oxlint (Vite-Standard) statt ESLint.

## Bekannte Probleme

- Der lokale Ordnerpfad enthält Doppelpunkte („Kunst 2024:25:26“). `npm run`-Skripte finden dadurch ihre Programme nicht, und der Vite-Dev-Server braucht `server.fs.strict: false`. Empfehlung: Projekt in einen Ordner ohne Doppelpunkte verschieben.

## Empfohlener nächster Schritt

task-9 (Seminare, Kunstkurse und Vorträge) auswählen.
