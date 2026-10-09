# Projektbrief

## Projektname

Website Stephan Graf Bentzel-Sturmfeder

## Idee / Problem

Eine Website für den Künstler Stephan Graf Bentzel-Sturmfeder mit vier Bereichen: (1) Künstler und Galerie, (2) Seminare und Vorträge, (3) Kunst-Netzwerk mit Veranstaltungen, (4) Journal. Die Kunst steht immer an erster Stelle; die Website tritt zurück und lässt die Werke wirken.

Priorität: 1. Künstler und Galerie, 2. Seminare für Unternehmen, 3. Netzwerk und Veranstaltungen, 4. Kunstkurse für Privatpersonen.

## Markenarchitektur

- Hauptmarke: Künstlername „Stephan Graf Bentzel-Sturmfeder“. Erstnennung voller Name, danach „Bentzel-Sturmfeder“.
- „Sturmfeder Projects“: Label für Seminare, Vorträge und Netzwerk, dezent als „Ein Format von Sturmfeder Projects“.
- Exklusiver Kreis im Netzwerk: **Name noch offen.** Arbeitstitel „Bentzel Club“. Kandidaten: „Stephan Bentzel“, „Stephan Graf Bentzel The Art Circle“, „Stephan Bentzel Sovereign Art Circle“. Der Name wird zentral konfigurierbar umgesetzt (i18n und Routenkonstante).

## Zielgruppe

Kunstinteressierte und Sammler, Geschäftsführung und HR (Seminar „The Art of Becoming“), Netzwerk-Gäste, Privatpersonen für Kunstkurse.

## Zielplattform

Responsive Website, Mobile zuerst, Domain www.sturmfederprojects.de (sturmfederprojects.eu leitet weiter). Zunächst nur Deutsch, Englisch vorbereitet über i18n.

## Kernfunktionen

- Öffentliche Seiten: Start, Künstler, Galerie mit Werkdetail und Lightbox, Seminare (Art of Becoming, Kunstkurse, Vorträge), Netzwerk mit Veranstaltungen und exklusivem Kreis, Journal, Kontakt, Impressum, Datenschutz.
- Admin-Dashboard für Werke, Journal, Veranstaltungen, Kunstkurse, Vita, Eingänge und Rechtstexte.
- Formulare mit Speicherung und E-Mail-Versand, Veranstaltungsanmeldung mit Warteliste und Stornierung.
- SEO, strukturierte Daten, Performance.

## Nicht-Ziele

Kein Online-Kauf (Erwerb nach persönlicher Absprache), keine Tracking-Tools, keine externen Schriften oder Drittanbieter-Einbettungen ohne Einwilligung, kein Cookie-Banner, kein öffentliches Login, kein Massenversand von E-Mails, zunächst kein Englisch.

## MVP

Alle öffentlichen Seiten mit echten Texten, Datenbank mit Dashboard, Formulare und E-Mails, SEO und Rechtliches.

## Design

Minimalistisch, galerieweiß, streng typografisch. Farben: #F7F6F2, #141414, #6B6B66, #D9D7D0, keine Akzentfarbe. Einzige Schrift Jost (lokal). 0 px Radius, keine Schatten oder Verläufe. Werke werden nie beschnitten.

## Definition of Done (projektweit)

- Build, Typprüfung und Linting laufen fehlerfrei.
- Responsiv und barrierearm (Fokus, Kontraste, Alt-Texte, semantisches HTML).
- Keine fest im Code verdrahteten UI-Texte.
- Name einheitlich geschrieben.
- Phase 1 zusätzlich: alle Seiten erreichbar, Texte wie im Masterprompt, kein Backend, kein Login.

## Technische Rahmenbedingungen

Siehe `.workshop/specialization/`.
