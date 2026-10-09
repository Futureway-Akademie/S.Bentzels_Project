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

## 2026-10-07 – Presse-Prompt und Roadmap Version 3

### Kontext

Der Prompt „Presse/Artikel“ fordert ein digitales Pressearchiv und einen Bereich „Interessante Artikel“ mit Datei-zuerst-Anlage (JPEG, PNG, PDF, externe Links) und einfacher Pflege im Dashboard. Der Prompt war nach Abschnitt 3 (Daten eines Pressartikels, Kategorien) abgeschnitten.

### Entscheidung

- Presse und „Interessante Artikel“ bilden einen eigenen Bereich neben dem Journal (Beiträge des Künstlers bleiben getrennt).
- Navigation: eigener Menüpunkt „Presse“ mit „Pressearchiv“ und „Interessante Artikel“ (Pfade unter `/presse`).
- Alle Angaben außer der Datei bzw. dem Link sind optional, fehlende Angaben erzeugen keine leeren Bereiche.
- Neue Tasks: task-37 (öffentlicher Bereich, Phase 1), task-38 (Dashboard Presse), task-39 (Dashboard Interessante Artikel). task-13, task-14, task-15 und task-20 angepasst.
- Hinweis: Gescannte Fremdartikel sind urheberrechtlich geschützt, die Rechte sind vor der Veröffentlichung zu klären.

### Begründung

Der Bereich ergänzt Galerie und Journal. Datenbank- und Dashboard-Arbeit gehört zu Phase 2.

## 2026-10-08 – Veranstaltungs-Prompt und Roadmap Version 4

Der Prompt „Seminare, Kurse, Vorlesungen und Events“ fordert ein gemeinsames Veranstaltungsmodul mit Kalender, einfacher Anlage (nur Titel und Datum), Duplizieren, wiederkehrenden Terminen, Interessenten-Anfragen, anonymer Statistik und der Rolle Event-Redakteur.

Entscheidungen:

- Ein Modul „Veranstaltungen“ mit erweiterbarer Tabelle der Veranstaltungsarten ersetzt die getrennten Tabellen `events` und `courses`. Die öffentlichen Seiten Seminare, Kurse, Vorträge und Netzwerk filtern nach Art.
- Nur der Titel ist Pflicht. Fehlende Angaben erzeugen öffentlich keine leeren Felder.
- „Eine Veranstaltung mit mehreren Terminen“ (`event_dates`) ist von „mehreren eigenständigen Veranstaltungen“ getrennt. Wiederkehrende Termine werden als einzelne, einzeln verschiebbare Termine erzeugt.
- Anfragen erhalten `event_id`. Die Statistik zählt nur anonyme Tageszähler.
- Die Rechte des Event-Redakteurs erzwingt die Datenbank (RLS), nicht nur die Oberfläche.
- Neue Tasks: task-40 (Datenmodell, Migration 0004), task-41 (öffentlicher Kalender), task-42 (Rollen und Statistik). task-19 wird zum Dashboard Veranstaltungen. task-20, task-23 und task-34 angepasst.
- Verbindliche Anmeldung, Warteliste, Zahlung und Rechnungen bleiben vorbereitet, aber ungebaut.
