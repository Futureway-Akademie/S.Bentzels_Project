import { parseVariants } from '../../lib/imageVariants'
import { supabase } from '../../lib/supabase'
import type { ArtworkPayload } from './artworkForm'
import { parseCrop, type Crop } from './cropMath'
import { nextSortOrder, sortUpdates } from './order'
import { slugify, uniqueSlug } from './slug'
import {
  copyFileByUrl,
  deleteArtworkWithFiles,
  removeFilesByUrl,
  uploadImage,
  uploadThumbFromUrl,
  type RemovalResult,
  type StoredImage,
} from './storage'
import { UploadError } from './uploadError'

export type ArtworkListItem = {
  id: string
  slug: string
  sort_order: number
  is_published: boolean
  archived_at: string | null
  main_image_url: string
  image_width: number
  image_height: number
  thumb_url: string | null
  title_de: string | null
  year: number | null
  status: 'verfuegbar' | 'reserviert' | 'verkauft' | null
  is_highlight: boolean
}

export type ArtworkRecord = ArtworkListItem &
  ArtworkPayload & {
    created_at: string
    updated_at: string
    thumb_crop: unknown
    /** Zusätzliche Bildgrößen für srcset (Liste aus url und width), fehlt bei älteren Werken */
    image_variants?: unknown
  }

export type ArtworkImageRecord = {
  id: string
  artwork_id: string
  sort_order: number
  image_url: string
  thumb_url: string | null
  image_width: number | null
  image_height: number | null
  image_variants?: unknown
}

const LIST_COLUMNS =
  'id, slug, sort_order, is_published, archived_at, main_image_url, image_width, image_height, thumb_url, title_de, year, status, is_highlight'

/** Alle gespeicherten Dateien eines hochgeladenen Bildes (zum Aufräumen). */
function storedUrls(stored: StoredImage): string[] {
  return [
    stored.url,
    stored.thumbUrl,
    ...stored.variants.map((variant) => variant.url),
  ]
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listArtworks(
  archived: boolean,
): Promise<ArtworkListItem[]> {
  let query = client()
    .from('artworks')
    .select(LIST_COLUMNS)
    .order('sort_order', { ascending: true })
  query = archived
    ? query.not('archived_at', 'is', null)
    : query.is('archived_at', null)
  const { data, error } = await query
  if (error) fail(error.message, error)
  return (data ?? []) as ArtworkListItem[]
}

export async function getArtwork(id: string): Promise<ArtworkRecord> {
  const { data, error } = await client()
    .from('artworks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) fail(error.message, error)
  return data as ArtworkRecord
}

export async function listArtworkImages(
  artworkId: string,
): Promise<ArtworkImageRecord[]> {
  const { data, error } = await client()
    .from('artwork_images')
    .select('*')
    .eq('artwork_id', artworkId)
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as ArtworkImageRecord[]
}

async function maxSortOrder(): Promise<number> {
  const { data, error } = await client()
    .from('artworks')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  if (error) fail(error.message, error)
  return nextSortOrder(data ?? []) - 1
}

/** Legt ein Werk allein aus einem Bild an. Alle weiteren Angaben bleiben leer. */
export async function createArtworkFromFile(
  file: File,
  options: { publish: boolean },
): Promise<ArtworkListItem> {
  const id = crypto.randomUUID()
  const stored = await uploadImage('artworks', id, file)
  const sortOrder = (await maxSortOrder()) + 1
  const { data, error } = await client()
    .from('artworks')
    .insert({
      id,
      main_image_url: stored.url,
      image_width: stored.width,
      image_height: stored.height,
      thumb_url: stored.thumbUrl,
      image_variants: stored.variants,
      is_published: options.publish,
      sort_order: sortOrder,
    })
    .select(LIST_COLUMNS)
    .single()
  if (error) {
    await removeFilesByUrl(storedUrls(stored))
    fail(error.message, error)
  }
  return data as ArtworkListItem
}

export async function updateArtwork(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client().from('artworks').update(patch).eq('id', id)
  if (error) fail(error.message, error)
}

/** Adresse aus dem Titel, eindeutig. Ohne Titel bleibt die bisherige Adresse. */
export async function slugForTitle(
  title: string | null,
  currentSlug: string,
  id: string,
): Promise<string> {
  const base = title ? slugify(title) : ''
  if (!base) return currentSlug
  const { data, error } = await client()
    .from('artworks')
    .select('slug')
    .like('slug', `${base}%`)
    .neq('id', id)
  if (error) fail(error.message, error)
  return uniqueSlug(
    base,
    (data ?? []).map((row: { slug: string }) => row.slug),
  )
}

export async function saveArtwork(
  record: ArtworkRecord,
  payload: ArtworkPayload,
): Promise<string> {
  const slug = await slugForTitle(payload.title_de, record.slug, record.id)
  await updateArtwork(record.id, { ...payload, slug })
  return slug
}

export async function setArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  await updateArtwork(id, {
    archived_at: archived ? new Date().toISOString() : null,
  })
}

/** Speichert die neue Reihenfolge, nur geänderte Positionen werden geschrieben. */
export async function saveOrder(ordered: ArtworkListItem[]): Promise<void> {
  const updates = sortUpdates(ordered)
  const results = await Promise.all(
    updates.map((update) =>
      client()
        .from('artworks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) fail(failed.error.message, failed.error)
}

/** Ersetzt das Hauptbild. Die alten Dateien werden erst nach dem Speichern entfernt. */
export async function replaceMainImage(
  record: ArtworkRecord,
  file: File,
): Promise<ArtworkRecord> {
  const stored = await uploadImage('artworks', record.id, file)
  try {
    await updateArtwork(record.id, {
      main_image_url: stored.url,
      image_width: stored.width,
      image_height: stored.height,
      thumb_url: stored.thumbUrl,
      thumb_crop: null,
      image_variants: stored.variants,
    })
  } catch (error) {
    await removeFilesByUrl(storedUrls(stored))
    throw error
  }
  await removeFilesByUrl([
    record.main_image_url,
    record.thumb_url,
    ...parseVariants(record.image_variants).map((variant) => variant.url),
  ])
  return {
    ...record,
    main_image_url: stored.url,
    image_width: stored.width,
    image_height: stored.height,
    thumb_url: stored.thumbUrl,
    thumb_crop: null,
    image_variants: stored.variants,
  }
}

/** Neue Vorschau aus einem Bildausschnitt (null = ganzes Bild). Das Originalbild bleibt unverändert. */
export async function applyThumbCrop(
  record: ArtworkRecord,
  crop: Crop | null,
): Promise<ArtworkRecord> {
  const thumb = await uploadThumbFromUrl(
    'artworks',
    record.id,
    record.main_image_url,
    crop ?? undefined,
  )
  try {
    await updateArtwork(record.id, { thumb_url: thumb.url, thumb_crop: crop })
  } catch (error) {
    await removeFilesByUrl([thumb.url])
    throw error
  }
  await removeFilesByUrl([record.thumb_url])
  return { ...record, thumb_url: thumb.url, thumb_crop: crop }
}

export function cropOf(record: Pick<ArtworkRecord, 'thumb_crop'>): Crop | null {
  return parseCrop(record.thumb_crop)
}

export async function addArtworkImage(
  artworkId: string,
  file: File,
  existing: ArtworkImageRecord[],
): Promise<ArtworkImageRecord> {
  const stored = await uploadImage('artworks', artworkId, file)
  const { data, error } = await client()
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      image_url: stored.url,
      thumb_url: stored.thumbUrl,
      image_width: stored.width,
      image_height: stored.height,
      image_variants: stored.variants,
      sort_order: nextSortOrder(existing),
    })
    .select('*')
    .single()
  if (error) {
    await removeFilesByUrl(storedUrls(stored))
    fail(error.message, error)
  }
  return data as ArtworkImageRecord
}

export async function removeArtworkImage(
  image: ArtworkImageRecord,
): Promise<RemovalResult> {
  const { error } = await client()
    .from('artwork_images')
    .delete()
    .eq('id', image.id)
  if (error) fail(error.message, error)
  return removeFilesByUrl([
    image.image_url,
    image.thumb_url,
    ...parseVariants(image.image_variants).map((variant) => variant.url),
  ])
}

export async function saveImageOrder(
  ordered: ArtworkImageRecord[],
): Promise<void> {
  const updates = sortUpdates(ordered)
  const results = await Promise.all(
    updates.map((update) =>
      client()
        .from('artwork_images')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) fail(failed.error.message, failed.error)
}

/**
 * Dupliziert ein Werk samt Bildern. Die Dateien werden kopiert, damit das Löschen einer Kopie
 * nie Bilder des Originals entfernt. Die Kopie ist zunächst nicht veröffentlicht.
 */
export async function duplicateArtwork(id: string): Promise<ArtworkRecord> {
  const db = client()
  const original = await getArtwork(id)
  const images = await listArtworkImages(id)
  const newId = crypto.randomUUID()
  const copiedUrls: string[] = []

  try {
    const mainUrl = await copyFileByUrl(original.main_image_url, newId)
    copiedUrls.push(mainUrl)
    let thumbUrl: string | null = null
    if (original.thumb_url) {
      thumbUrl = await copyFileByUrl(original.thumb_url, newId)
      copiedUrls.push(thumbUrl)
    }

    const {
      id: _id,
      created_at: _created,
      updated_at: _updated,
      slug: _slug,
      sort_order: _sort,
      ...rest
    } = original
    void [_id, _created, _updated, _slug, _sort]
    const title = original.title_de ? `${original.title_de} (Kopie)` : null
    const slug = await slugForTitle(title, `werk-${newId.slice(0, 8)}`, newId)
    const { data, error } = await db
      .from('artworks')
      .insert({
        ...rest,
        id: newId,
        slug,
        title_de: title,
        main_image_url: mainUrl,
        thumb_url: thumbUrl,
        is_published: false,
        archived_at: null,
        sort_order: (await maxSortOrder()) + 1,
      })
      .select('*')
      .single()
    if (error) fail(error.message, error)

    for (const image of images) {
      const imageUrl = await copyFileByUrl(image.image_url, newId)
      copiedUrls.push(imageUrl)
      const imageThumb = image.thumb_url
        ? await copyFileByUrl(image.thumb_url, newId)
        : null
      if (imageThumb) copiedUrls.push(imageThumb)
      const result = await db.from('artwork_images').insert({
        artwork_id: newId,
        image_url: imageUrl,
        thumb_url: imageThumb,
        image_width: image.image_width,
        image_height: image.image_height,
        sort_order: image.sort_order,
      })
      if (result.error) fail(result.error.message, result.error)
    }
    return data as ArtworkRecord
  } catch (error) {
    // Nichts Halbes zurücklassen: Zeile (löscht Bilder mit) und kopierte Dateien entfernen
    await db.from('artworks').delete().eq('id', newId)
    await removeFilesByUrl(copiedUrls)
    throw error
  }
}

export { deleteArtworkWithFiles }
