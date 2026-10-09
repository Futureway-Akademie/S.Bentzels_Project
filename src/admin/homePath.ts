import { routes } from '../config/routes'
import type { AdminRole } from './permissions'

/** Startseite je Rolle: Redakteure beginnen bei den Veranstaltungen. */
export function homePath(role: AdminRole | null): string {
  return role === 'event_editor' ? routes.adminEvents : routes.admin
}
