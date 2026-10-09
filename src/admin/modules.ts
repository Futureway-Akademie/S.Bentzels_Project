import { routes } from '../config/routes'
import type { AdminRole } from './permissions'

export type AdminModule = {
  id: string
  labelKey: string
  to: string
  /** true, sobald das Modul umgesetzt ist, sonst erscheint eine Platzhalterseite */
  ready: boolean
  /** Zeigt in der Seitenleiste die Zahl neuer Eingänge */
  badge?: 'inquiries'
  /** Rollen außer Administratoren, die das Modul nutzen dürfen (Administratoren dürfen alles) */
  roles?: AdminRole[]
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
    ready: true,
  },
  {
    id: 'journal',
    labelKey: 'admin.modules.journal',
    to: routes.adminJournal,
    ready: true,
  },
  {
    id: 'events',
    labelKey: 'admin.modules.events',
    to: routes.adminEvents,
    ready: true,
    roles: ['event_editor'],
  },
  {
    id: 'vita',
    labelKey: 'admin.modules.vita',
    to: routes.adminVita,
    ready: true,
  },
  {
    id: 'visibility',
    labelKey: 'admin.modules.visibility',
    to: routes.adminVisibility,
    ready: true,
  },
  {
    id: 'legal',
    labelKey: 'admin.modules.legal',
    to: routes.adminLegal,
    ready: true,
  },
  {
    id: 'press',
    labelKey: 'admin.modules.press',
    to: routes.adminPress,
    ready: true,
  },
  {
    id: 'curated',
    labelKey: 'admin.modules.curated',
    to: routes.adminCurated,
    ready: true,
  },
  {
    id: 'stats',
    labelKey: 'admin.modules.stats',
    to: routes.adminStats,
    ready: true,
    roles: ['event_editor'],
  },
  {
    id: 'inquiries',
    labelKey: 'admin.modules.inquiries',
    to: routes.adminInquiries,
    ready: true,
    badge: 'inquiries',
    roles: ['event_editor'],
  },
]
