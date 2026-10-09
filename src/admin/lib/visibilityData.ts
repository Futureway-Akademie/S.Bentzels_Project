import { supabase } from '../../lib/supabase'
import { asFlags, type SettingKey, type StoredFlags } from './visibility'
import { UploadError } from './uploadError'

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export type SettingsData = Record<SettingKey, StoredFlags>

export async function loadVisibility(): Promise<SettingsData> {
  const { data, error } = await client()
    .from('site_settings')
    .select('key, value')
    .in('key', ['gallery_visibility', 'event_visibility'])
  if (error) fail(error.message, error)
  const result: SettingsData = { gallery_visibility: {}, event_visibility: {} }
  for (const row of (data ?? []) as { key: SettingKey; value: unknown }[])
    result[row.key] = asFlags(row.value)
  return result
}

/** Speichert die Schalter einer Gruppe. Gespeichert wird der ganze Eintrag, damit nichts verloren geht. */
export async function saveVisibility(
  setting: SettingKey,
  value: StoredFlags,
): Promise<void> {
  const { error } = await client()
    .from('site_settings')
    .upsert({ key: setting, value }, { onConflict: 'key' })
  if (error) fail(error.message, error)
}
