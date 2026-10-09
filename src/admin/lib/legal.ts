import {
  legalDocsFromRows,
  LEGAL_KEYS,
  type LegalDocs,
  type LegalKind,
} from '../../lib/legalDoc'
import { supabase } from '../../lib/supabase'
import { UploadError } from './uploadError'

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

export async function loadLegal(): Promise<LegalDocs> {
  const { data, error } = await client()
    .from('site_settings')
    .select('key, value')
    .in('key', Object.values(LEGAL_KEYS))
  if (error) throw new Error(error.message, { cause: error })
  return legalDocsFromRows((data ?? []) as { key: string; value: unknown }[])
}

/** Speichert den Text als { html } unter dem Schlüssel des jeweiligen Rechtstexts. */
export async function saveLegal(kind: LegalKind, html: string): Promise<void> {
  const { error } = await client()
    .from('site_settings')
    .upsert({ key: LEGAL_KEYS[kind], value: { html } }, { onConflict: 'key' })
  if (error) throw new Error(error.message, { cause: error })
}
