import { supabase } from '../../lib/supabase'
import type { PressPayload } from './pressForm'
import { nextSortOrder, sortUpdates } from './order'
import { slugify, uniqueSlug } from './slug'
import {
  deletePressItemWithFiles,
  removeFilesByUrl,
  uploadPressFile,
  type RemovalResult,
  type StoredPressFile,
} from './storage'
import { UploadError } from './uploadError'

export type PressRecord = PressPayload & {
  id: string
  created_at: string
  sort_order: number
  thumbnail_url: string | null
  thumbnail_width: number | null
  thumbnail_height: number | null
  file_url: string | null
  file_type: 'image' | 'pdf' | null
  file_width: number | null
  file_height: number | null
}

export type PressCategory = {
  id: string
  slug: string
  name_de: string
  sort_order: number
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listPressItems(): Promise<PressRecord[]> {
  const { data, error } = await client()
    .from('press_items')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as PressRecord[]
}

export async function getPressItem(id: string): Promise<PressRecord> {
  const { data, error } = await client()
    .from('press_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) fail(error.message, error)
  return data as PressRecord
}

async function lastPosition(): Promise<number> {
  const { data, error } = await client()
    .from('press_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  if (error) fail(error.message, error)
  return nextSortOrder(data ?? []) - 1
}

const fileFields = (stored: StoredPressFile) => ({
  file_url: stored.fileUrl,
  file_type: stored.fileType,
  file_width: stored.fileWidth,
  file_height: stored.fileHeight,
  thumbnail_url: stored.thumbnailUrl,
  thumbnail_width: stored.thumbnailWidth,
  thumbnail_height: stored.thumbnailHeight,
})

/** Legt einen Eintrag allein aus einer Datei an (JPEG, PNG, WebP oder PDF). Alles Weitere bleibt leer. */
export async function createPressFromFile(file: File): Promise<PressRecord> {
  const stored = await uploadPressFile(file)
  try {
    const { data, error } = await client()
      .from('press_items')
      .insert({
        ...fileFields(stored),
        sort_order: (await lastPosition()) + 1,
        is_published: false,
      })
      .select('*')
      .single()
    if (error) fail(error.message, error)
    return data as PressRecord
  } catch (error) {
    // Nichts Halbes zurücklassen
    await removeFilesByUrl([stored.fileUrl, stored.thumbnailUrl])
    throw error
  }
}

/** Legt einen Eintrag nur mit einem Link an. */
export async function createPressFromLink(url: string): Promise<PressRecord> {
  const { data, error } = await client()
    .from('press_items')
    .insert({
      external_url: url.trim(),
      sort_order: (await lastPosition()) + 1,
      is_published: false,
    })
    .select('*')
    .single()
  if (error) fail(error.message, error)
  return data as PressRecord
}

export async function updatePressItem(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client()
    .from('press_items')
    .update(patch)
    .eq('id', id)
  if (error) fail(error.message, error)
}

/** Tauscht die Datei aus. Die alten Dateien werden erst nach dem Speichern entfernt. */
export async function replacePressFile(
  record: PressRecord,
  file: File,
): Promise<PressRecord> {
  const stored = await uploadPressFile(file)
  const fields = fileFields(stored)
  try {
    await updatePressItem(record.id, fields)
  } catch (error) {
    await removeFilesByUrl([stored.fileUrl, stored.thumbnailUrl])
    throw error
  }
  await removeFilesByUrl([record.file_url, record.thumbnail_url])
  return { ...record, ...fields }
}

/** Entfernt die Datei und behält den Eintrag, wenn ein Link vorhanden ist. */
export async function removePressFile(
  record: PressRecord,
): Promise<PressRecord> {
  const cleared = {
    file_url: null,
    file_type: null,
    file_width: null,
    file_height: null,
    thumbnail_url: null,
    thumbnail_width: null,
    thumbnail_height: null,
  }
  await updatePressItem(record.id, cleared)
  await removeFilesByUrl([record.file_url, record.thumbnail_url])
  return { ...record, ...cleared }
}

export async function deletePressItem(id: string): Promise<RemovalResult> {
  return deletePressItemWithFiles(id)
}

/** Speichert die neue Reihenfolge, nur geänderte Positionen werden geschrieben. */
export async function savePressOrder(ordered: PressRecord[]): Promise<void> {
  const updates = sortUpdates(ordered)
  const results = await Promise.all(
    updates.map((update) =>
      client()
        .from('press_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) fail(failed.error.message, failed.error)
}

// ----- Kategorien

export async function listPressCategories(): Promise<PressCategory[]> {
  const { data, error } = await client()
    .from('press_categories')
    .select('id, slug, name_de, sort_order')
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as PressCategory[]
}

export async function addPressCategory(
  name: string,
  existing: PressCategory[],
): Promise<PressCategory> {
  const slug = uniqueSlug(
    slugify(name) || 'kategorie',
    existing.map((category) => category.slug),
  )
  const sort =
    Math.max(0, ...existing.map((category) => category.sort_order)) + 10
  const { data, error } = await client()
    .from('press_categories')
    .insert({ slug, name_de: name.trim(), sort_order: sort })
    .select('id, slug, name_de, sort_order')
    .single()
  if (error) fail(error.message, error)
  return data as PressCategory
}

export async function renamePressCategory(
  id: string,
  name: string,
): Promise<void> {
  const { error } = await client()
    .from('press_categories')
    .update({ name_de: name.trim() })
    .eq('id', id)
  if (error) fail(error.message, error)
}

/** Löscht die Kategorie. Einträge behalten ihre Daten und haben danach keine Kategorie. */
export async function deletePressCategory(id: string): Promise<void> {
  const { error } = await client()
    .from('press_categories')
    .delete()
    .eq('id', id)
  if (error) fail(error.message, error)
}
