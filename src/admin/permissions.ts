// Rollen und Rechte im Dashboard (reine Funktionen, ohne Imports).
// Die eigentliche Sicherheit liegt in den Datenbankregeln (Funktionen is_admin und
// is_event_editor), dies steuert Menü und Seitenzugriff. Neue Rollen: hier den Typ ergänzen,
// in der Datenbank die Rolle zulassen und bei den Modulen in `modules.ts` eintragen.

export type AdminRole = 'admin' | 'event_editor'

export function isAdminRole(value: unknown): value is AdminRole {
  return value === 'admin' || value === 'event_editor'
}

/** Administratoren dürfen alles, weitere Rollen nur Module, die sie ausdrücklich nennen. */
export function canAccess(
  role: AdminRole | null,
  allowed: readonly AdminRole[] = [],
): boolean {
  if (role === null) return false
  return role === 'admin' || allowed.includes(role)
}

export function modulesFor<T extends { roles?: readonly AdminRole[] }>(
  modules: readonly T[],
  role: AdminRole | null,
): T[] {
  return modules.filter((module) => canAccess(role, module.roles))
}
