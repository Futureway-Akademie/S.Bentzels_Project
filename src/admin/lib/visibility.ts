// Globale Sichtbarkeitsschalter (reine Funktionen, ohne Imports).
// Ein Schalter blendet eine Angabe überall auf der Website aus, löscht aber keine Daten.
// Die Werte stehen in der Tabelle site_settings (ein Eintrag je Gruppe, Werte als JSON).
// Neue Schalter: in `VISIBILITY_GROUPS` ergänzen, in der Datenbank-Sicht (events_public bzw.
// artworks_public) maskieren und die Texte unter admin.visibility ergänzen. Ein neuer Schalter
// ist ohne Eintrag in der Datenbank „sichtbar“.

export type SettingKey = 'gallery_visibility' | 'event_visibility'

export type FlagDefinition = { key: string }

export type GroupDefinition = {
  setting: SettingKey
  /** Schlüssel unter admin.visibility.groups */
  id: 'gallery' | 'events'
  flags: FlagDefinition[]
}

export const VISIBILITY_GROUPS: GroupDefinition[] = [
  {
    setting: 'gallery_visibility',
    id: 'gallery',
    flags: [
      { key: 'price' },
      { key: 'dimensions' },
      { key: 'technique' },
      { key: 'year' },
      { key: 'availability' },
      { key: 'description' },
    ],
  },
  {
    setting: 'event_visibility',
    id: 'events',
    flags: [
      { key: 'price' },
      { key: 'free_places' },
      { key: 'participants' },
      { key: 'speaker' },
      { key: 'location' },
    ],
  },
]

export type StoredFlags = Record<string, unknown>

/** Aktuelle Werte der bekannten Schalter: nur ausdrückliches „false“ blendet aus. */
export function flagValues(
  stored: StoredFlags | null | undefined,
  group: GroupDefinition,
): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const flag of group.flags)
    result[flag.key] = stored?.[flag.key] !== false
  return result
}

/** Setzt einen Schalter und behält alle anderen Einträge, auch unbekannte, unverändert. */
export function withFlag(
  stored: StoredFlags | null | undefined,
  key: string,
  value: boolean,
): StoredFlags {
  return { ...(stored ?? {}), [key]: value }
}

/** Ob ein Wert ein Objekt aus Schaltern ist (so liefert ihn die Datenbank). */
export function asFlags(value: unknown): StoredFlags {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as StoredFlags)
    : {}
}
