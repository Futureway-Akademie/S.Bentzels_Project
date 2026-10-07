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
- `src/data/artworks.ts` (8 Werke), `events.ts` (3 Veranstaltungen, 2 Kurse), `posts.ts` (2 Beiträge), `vita.ts` (38 Einträge), `placeholder.ts` (graue SVG-Platzhalter in Originalproportionen).
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
