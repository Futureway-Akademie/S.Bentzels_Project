# Architektur

Geplant (siehe `.workshop/specialization/STACK.md`):

- Frontend: React, TypeScript, Tailwind, Vite, react-i18next
- Daten: bis Phase 2 typisierte Platzhalter in `src/data/`, danach Supabase
- Backend: Supabase mit Row Level Security, Storage, Auth, Edge Functions (Resend)
- Bereiche: Künstler und Galerie, Seminare und Vorträge, Netzwerk, Journal, Admin-Dashboard

Details folgen mit der Umsetzung.

## Design-System (task-2)

- Tokens und Basisstile: `src/styles/index.css` (Tailwind `@theme`, Klassen `.label`, `.btn`, `.btn-link`, `.reveal`, `.container-page`, `.grid-12`, `.prose-measure`, `.artwork-img`)
- Komponenten: `src/components/Button.tsx`, `src/components/Reveal.tsx`
- Vorschauseite zur Abnahme: `/design-system` (wird vor dem Launch entfernt)

## Platzhalterdaten (task-4)

- `src/data/types.ts`: Typen entsprechen dem geplanten Supabase-Datenmodell (Werke, Werkbilder, Journal, Veranstaltungen, Eventfotos, Kunstkurse, Vita). Felder mit `*De` und `*En` für spätere Übersetzung.
- `src/data/artworks.ts` (8 Werke), `events.ts` (3 Veranstaltungen, 2 Kurse), `posts.ts` (2 Beiträge), `vita.ts` (44 Einträge), `placeholder.ts` (graue SVG-Platzhalter in Originalproportionen).
- Beitrags- und Beschreibungstexte, Termine und Orte der Veranstaltungen und Kurse sowie alle Bilder sind Platzhalter und werden in Phase 2 durch Supabase-Daten ersetzt.
- Die Dashboards für Werke, Journal und Veranstaltungen folgen in Phase 2 (task-17 bis 19).

## Komponenten (task-3)

- `SectionLabel`: nummerierter Abschnitt („01 — WERKE“)
- `ArtworkCard`: Werk mit Bild in Originalproportionen, Titel, Jahr, Maßen und Statuslabel, verlinkt auf `/galerie/:slug`
- `Timeline`: Jahr links, Eintrag rechts, aus `VitaEntry[]`
- `Lightbox`: Vollbild per Portal mit Zoom, Pfeiltasten, Esc, Zählung, Fokus auf „Schließen“ und Fokus-Rückgabe, Seiten-Scroll gesperrt
- Alle Komponenten sind auf `/design-system` zu sehen. Wischgesten für die Lightbox folgen in task-31.

## Layout und Routing (task-5)

- `src/config/routes.ts`: alle Pfade zentral. Der Pfad des exklusiven Kreises (`routes.circle`, Arbeitstitel „Bentzel Club“) wird nur hier festgelegt. Der Anzeigename steht in `de.json` unter `circle.name`.
- `src/layout/`: `Layout` (Header, Inhalt, Footer, Scroll nach oben), `Header` (Dropdowns auf dem Desktop, Vollbild-Menü unter 1024 px), `Footer`, `Logo`, `navItems`.
- Seiten ohne eigenen Inhalt nutzen `PagePlaceholder`, bis sie in task-6 bis 12 umgesetzt werden. Unbekannte Pfade zeigen die 404-Seite mit Link zur Galerie (im Stil nachgezogen in task-28).

## Startseite (task-6)

- `src/pages/Home.tsx`: Hero mit Namen und Platzhalterbild, Statement, vier nummerierte Abschnitte (Werke, The Art of Becoming, nächste Begegnung, Journal). Werke, nächster Termin und neuester Beitrag werden aus `src/data/` abgeleitet und später aus Supabase geladen. Mehrteilige Werke laufen über die volle Breite, die übrigen im Spalten-Raster. Fehlt eine kommende Veranstaltung, entfällt der Abschnitt „Nächste Begegnung“ und das Journal wird „03“.
- `src/lib/format.ts`: deutsche Datums- und Zeitformate.

## Künstlerseite (task-7)

- `src/pages/Artist.tsx` (`/kuenstler`): Statement, Porträt mit Einleitung, kreativer Prozess in vier Phasen (Bild und Text abwechselnd), Überleitung zu The Art of Becoming, Vita nach Kategorien (Ausbildung, Ausstellungen, Messen, Kuratorische Projekte) und Zitat „Stimmen“. Die Vita kommt aus `src/data/vita.ts`.
- Porträt und Prozessfotos sind graue Platzhalter.

## Galerie und Werkdetail (task-8)

- Werkdaten: Bis auf Bild und Kennung sind alle Angaben optional (`null`). Untergrund ist Freitext (`supportDe`). Dieselbe Struktur gilt für die Datenbank in Phase 2.
- `src/config/gallerySettings.ts`: globale Sichtbarkeitsschalter (Preis, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung) über `useGalleryVisibility()`. Aktuell Konfiguration im Code, ab task-34 aus der Datenbank. Ein Schalter blendet nur aus und löscht nichts. Neue Schalter werden dort ergänzt.
- `src/pages/Gallery.tsx`: Filter (Untergrund, Zyklus, Jahr, nur verfügbare) entstehen aus den vorhandenen Daten und entfallen bei fehlender oder ausgeblendeter Angabe, Zustand in der URL. Ruhiges Masonry (1 bis 4 Spalten), Mehrteiler in voller Breite.
- `src/pages/ArtworkDetail.tsx`: Bild zuerst, Werkinformationen optional aufklappbar, „Werk anfragen“ vorerst als mailto (Formular in task-23), Vor/Zurück.
- `src/components/Lightbox.tsx`: drei Zoomstufen, Pfeiltasten, Wischen, Wechsel zwischen allen Werken mit Anpassung der URL.
- Fehlende oder ausgeblendete Angaben, auch der Preis, werden nicht angezeigt. Alt-Texte nennen das Jahr nur, wenn es sichtbar ist.

## Seminare, Kunstkurse und Vorträge (task-9)

- `src/pages/Seminars.tsx` (`/seminare`): Label „Ein Format von Sturmfeder Projects“, Headline, Text, drei große Kacheln (invertieren beim Hover). `Courses.tsx` (`/seminare/kunstkurse`): Text und kommende Termine aus `courses` (nur zukünftige, veröffentlichte). `Talks.tsx` (`/seminare/vortraege`): vier nummerierte Themen, Zielgruppe.
- Die Buttons „Individuellen Kunstkurs anfragen“ und „Vortrag anfragen“ sind vorerst E-Mail-Links mit Betreff. Die Formulare folgen in task-23.
- Kurstermine, -beschreibungen und -orte sind Platzhalter.

## The Art of Becoming (task-10)

- `src/pages/ArtOfBecoming.tsx` (`/seminare/the-art-of-becoming`): Hero mit Kernbotschaft, Einleitung, Vierzeiler (zeilenweise gestaffelt eingeblendet), vier Module, Erlebnisliste, wissenschaftliches Fundament als Akkordeon (native `details`), Eckdaten, Leitung, Abschluss-CTA. Alle Texte stehen unter `becoming.*` in `de.json`.
- Die Überraschungsinterventionen der Module sind bewusst nicht genauer beschrieben als im Masterprompt.
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament sind Entwürfe und müssen fachlich geprüft werden. Porträtfotos und die Kurzbio von Antonie Höldrich sind Platzhalter.
- Der Termin-Button ist vorerst ein E-Mail-Link (Formular in task-23).
