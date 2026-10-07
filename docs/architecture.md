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
