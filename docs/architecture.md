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
