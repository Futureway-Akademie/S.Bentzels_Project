# Entscheidungen

## 2026-10-07 – Name des exklusiven Netzwerk-Kreises

### Kontext

Der Masterprompt nennt den exklusiven Kreis „Der Bentzel Club“.

### Entscheidung

„Bentzel Club“ ist nur ein Arbeitstitel. Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Der Name und die URL werden zentral konfigurierbar umgesetzt. Die endgültige Wahl steht aus.

### Begründung

Eine spätere Umbenennung soll ohne Eingriffe in mehrere Dateien möglich sein.

## 2026-10-07 – Umsetzung im Repository statt in Lovable

### Kontext

Der Masterprompt ist für Lovable formuliert.

### Entscheidung

Das Projekt wird in diesem Repository mit React, TypeScript, Tailwind und Vite umgesetzt. Inhalte und Vorgaben des Prompts bleiben maßgeblich.

### Begründung

Das Workshop-Repository führt Planung und Fortschritt zentral.

## 2026-10-07 – Galerie-Prompt und Roadmap Version 2

### Kontext

Der Galerie-Prompt fordert eine museale Online-Galerie für etwa 60 Werke mit optionalen Werkangaben, zentralen Sichtbarkeitsschaltern, Bildausschnitt für Vorschaubilder, Wischgesten, PDF-Werkblatt, Werkanfrage und datenschutzfreundlicher Statistik. Der Abschnitt „13. Performance“ lag dem Prompt nicht mehr vollständig bei.

### Entscheidung

- Alle Werkangaben außer dem Bild sind optional. Fehlendes oder global ausgeblendetes wird nicht angezeigt, auch kein „Preis auf Anfrage“.
- Das Werkdetail zeigt das Bild zuerst, Werkinformationen öffnen optional.
- Globale Sichtbarkeitsschalter: in task-8 als Konfiguration im Code, ab Phase 2 aus der Datenbank (task-34).
- Neue Tasks: task-34 Sichtbarkeitsschalter, task-35 Werkstatistik, task-36 PDF-Werkblatt. task-14, task-17, task-20, task-31 und task-32 angepasst.

### Begründung

Der Galerie-Prompt ergänzt den Masterprompt und hat für die Galerie Vorrang. Datenbank- und Admin-Funktionen gehören in Phase 2 bis 4.
