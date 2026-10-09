import { supabase } from '../../lib/supabase'
import type { CuratedPayload } from './curatedForm'
import { nextSortOrder, sortUpdates } from './order'
import { removeFilesByUrl, uploadImage } from './storage'
import { UploadError } from './uploadError'

export type CuratedRecord = CuratedPayload & {
  id: string
  created_at: string
  sort_order: number
  is_published: boolean
  thumbnail_url: string | null
  thumbnail_width: number | null
  thumbnail_height: number | null
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listCurated(): Promise<CuratedRecord[]> {
  const { data, error } = await client()
    .from('curated_links')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as CuratedRecord[]
}

/** Legt einen Eintrag nur mit einem Link an. Alles Weitere bleibt leer, der Eintrag ist zunächst ausgeblendet. */
export async function createCurated(url: string): Promise<CuratedRecord> {
  const db = client()
  const { data: last, error: lastError } = await db
    .from('curated_links')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  if (lastError) fail(lastError.message, lastError)
  const { data, error } = await db
    .from('curated_links')
    .insert({
      url: url.trim(),
      sort_order: nextSortOrder(last ?? []),
      is_published: false,
    })
    .select('*')
    .single()
  if (error) fail(error.message, error)
  return data as CuratedRecord
}

export async function updateCurated(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client()
    .from('curated_links')
    .update(patch)
    .eq('id', id)
  if (error) fail(error.message, error)
}

/**
 * Speichert ein Vorschaubild (höchstens 800 px). Das große Bild wird nicht gebraucht und
 * sofort wieder entfernt. Das alte Vorschaubild wird erst nach dem Speichern entfernt.
 */
export async function replaceCuratedThumbnail(
  record: CuratedRecord,
  file: File,
): Promise<CuratedRecord> {
  const stored = await uploadImage('press', 'links', file)
  await removeFilesByUrl([stored.url]).catch(() => undefined)
  const fields = {
    thumbnail_url: stored.thumbUrl,
    thumbnail_width: stored.thumbWidth,
    thumbnail_height: stored.thumbHeight,
  }
  try {
    await updateCurated(record.id, fields)
  } catch (error) {
    await removeFilesByUrl([stored.thumbUrl])
    throw error
  }
  await removeFilesByUrl([record.thumbnail_url])
  return { ...record, ...fields }
}

export async function removeCuratedThumbnail(
  record: CuratedRecord,
): Promise<CuratedRecord> {
  const cleared = {
    thumbnail_url: null,
    thumbnail_width: null,
    thumbnail_height: null,
  }
  await updateCurated(record.id, cleared)
  await removeFilesByUrl([record.thumbnail_url])
  return { ...record, ...cleared }
}

/** Löscht den Eintrag, danach das Vorschaubild. Liefert die Zahl nicht entfernter Dateien. */
export async function deleteCurated(record: CuratedRecord): Promise<number> {
  const { error } = await client()
    .from('curated_links')
    .delete()
    .eq('id', record.id)
  if (error) fail(error.message, error)
  const result = await removeFilesByUrl([record.thumbnail_url])
  return result.failed
}

export async function saveCuratedOrder(
  ordered: CuratedRecord[],
): Promise<void> {
  const updates = sortUpdates(ordered)
  const results = await Promise.all(
    updates.map((update) =>
      client()
        .from('curated_links')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) fail(failed.error.message, failed.error)
}
