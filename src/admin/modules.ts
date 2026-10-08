import { routes } from '../config/routes'

export type AdminModule = {
  id: string
  labelKey: string
  to: string
  /** true, sobald das Modul umgesetzt ist, sonst erscheint eine Platzhalterseite */
  ready: boolean
  /** Zeigt in der Seitenleiste die Zahl neuer Eingänge */
  badge?: 'inquiries'
}

// Weitere Module (Rechtstexte, Sichtbarkeit, Statistik) werden hier ergänzt.
export const adminModules: AdminModule[] = [
  {
    id: 'overview',
    labelKey: 'admin.modules.overview',
    to: routes.admin,
    ready: true,
  },
  {
    id: 'artworks',
    labelKey: 'admin.modules.artworks',
    to: routes.adminArtworks,
    ready: false,
  },
  {
    id: 'journal',
    labelKey: 'admin.modules.journal',
    to: routes.adminJournal,
    ready: false,
  },
  {
    id: 'events',
    labelKey: 'admin.modules.events',
    to: routes.adminEvents,
    ready: false,
  },
  {
    id: 'courses',
    labelKey: 'admin.modules.courses',
    to: routes.adminCourses,
    ready: false,
  },
  {
    id: 'vita',
    labelKey: 'admin.modules.vita',
    to: routes.adminVita,
    ready: false,
  },
  {
    id: 'press',
    labelKey: 'admin.modules.press',
    to: routes.adminPress,
    ready: false,
  },
  {
    id: 'curated',
    labelKey: 'admin.modules.curated',
    to: routes.adminCurated,
    ready: false,
  },
  {
    id: 'inquiries',
    labelKey: 'admin.modules.inquiries',
    to: routes.adminInquiries,
    ready: false,
    badge: 'inquiries',
  },
]
