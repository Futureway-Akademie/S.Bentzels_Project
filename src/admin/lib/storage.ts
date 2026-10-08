import { supabase } from '../../lib/supabase'
import { pdfFirstPageThumbnail } from './pdfThumbnail'
import { groupByBucket, looksLikePdf, MAX_PDF_BYTES } from './imageMath'
import { processImage, type EncodedImage } from './images'
import { UploadError } from './uploadError'

export type Bucket = 'artworks' | 'posts' | 'events' | 'people' | 'press'

export type StoredImage = {
  url: string
  thumbUrl: string
  width: number
  height: number
  thumbWidth: number
  thumbHeight: number
  /** Gespeicherte Pfade, z. B. zum Aufräumen bei einem Abbruch. */
  paths: string[]
}

export type StoredPressFile = {
  fileUrl: string
  fileType: 'image' | 'pdf'
  fileWidth: number | null
  fileHeight: number | null
  thumbnailUrl: string
  thumbnailWidth: number
  thumbnailHeight: number
  paths: string[]
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

const CACHE_SECONDS = '31536000'

async function put(
  bucket: Bucket,
  path: string,
  body: Blob,
  contentType: string,
): Promise<string> {
  const storage = client().storage.from(bucket)
  const { error } = await storage.upload(path, body, {
    contentType,
    cacheControl: CACHE_SECONDS,
    upsert: false,
  })
  if (error)
    throw new UploadError(
      'upload',
      `Hochladen fehlgeschlagen: ${error.message}`,
      { cause: error },
    )
  return storage.getPublicUrl(path).data.publicUrl
}

/** Löscht Dateien in einem Bucket. Fehlende Dateien gelten nicht als Fehler. */
export async function removePaths(
  bucket: Bucket,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return
  const { error } = await client().storage.from(bucket).remove(paths)
  if (error)
    throw new UploadError(
      'delete',
      `Löschen fehlgeschlagen: ${error.message}`,
      { cause: error },
    )
}

async function putPair(
  bucket: Bucket,
  folder: string,
  id: string,
  full: EncodedImage,
  thumb: EncodedImage,
): Promise<StoredImage> {
  const fullPath = `${folder}/${id}.${full.ext}`
  const thumbPath = `${folder}/${id}-800.${thumb.ext}`
  try {
    const [url, thumbUrl] = await Promise.all([
      put(bucket, fullPath, full.blob, full.mime),
      put(bucket, thumbPath, thumb.blob, thumb.mime),
    ])
    return {
      url,
      thumbUrl,
      width: full.width,
      height: full.height,
      thumbWidth: thumb.width,
      thumbHeight: thumb.height,
      paths: [fullPath, thumbPath],
    }
  } catch (error) {
    // Nichts Halbes zurücklassen
    await removePaths(bucket, [fullPath, thumbPath]).catch(() => undefined)
    throw error
  }
}

/** Lädt ein Bild hoch: Original (max. 2400 px) und Vorschau (max. 800 px), beide als WebP. */
export async function uploadImage(
  bucket: Bucket,
  folder: string,
  file: File,
  options: Parameters<typeof processImage>[1] = {},
): Promise<StoredImage> {
  const { full, thumb } = await processImage(file, options)
  return putPair(bucket, folder, crypto.randomUUID(), full, thumb)
}

/**
 * Lädt eine Presse-Datei hoch. Bilder werden wie Werkbilder verarbeitet, PDFs bleiben unverändert
 * und erhalten ein Vorschaubild aus der ersten Seite.
 */
export async function uploadPressFile(
  file: File,
  folder = 'archiv',
): Promise<StoredPressFile> {
  const isPdf = file.type === 'application/pdf'
  if (!isPdf) {
    const stored = await uploadImage('press', folder, file)
    return {
      fileUrl: stored.url,
      fileType: 'image',
      fileWidth: stored.width,
      fileHeight: stored.height,
      thumbnailUrl: stored.thumbUrl,
      thumbnailWidth: stored.thumbWidth,
      thumbnailHeight: stored.thumbHeight,
      paths: stored.paths,
    }
  }

  if (file.size > MAX_PDF_BYTES)
    throw new UploadError('size', 'PDF ist größer als 25 MB')
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (!looksLikePdf(head))
    throw new UploadError('type', 'Die Datei ist kein gültiges PDF')

  // Zuerst die Vorschau erzeugen: Ist das PDF unlesbar, wird nichts hochgeladen.
  const thumb = await pdfFirstPageThumbnail(file)
  const id = crypto.randomUUID()
  const pdfPath = `${folder}/${id}.pdf`
  const thumbPath = `${folder}/${id}-800.${thumb.ext}`
  try {
    const [fileUrl, thumbnailUrl] = await Promise.all([
      put('press', pdfPath, file, 'application/pdf'),
      put('press', thumbPath, thumb.blob, thumb.mime),
    ])
    return {
      fileUrl,
      fileType: 'pdf',
      fileWidth: null,
      fileHeight: null,
      thumbnailUrl,
      thumbnailWidth: thumb.width,
      thumbnailHeight: thumb.height,
      paths: [pdfPath, thumbPath],
    }
  } catch (error) {
    await removePaths('press', [pdfPath, thumbPath]).catch(() => undefined)
    throw error
  }
}

export type RemovalResult = { removed: number; failed: number }

/** Entfernt alle Dateien, auf die die Adressen zeigen. Fremde Adressen werden ignoriert. */
export async function removeFilesByUrl(
  urls: (string | null | undefined)[],
): Promise<RemovalResult> {
  const groups = groupByBucket(urls)
  let removed = 0
  let failed = 0
  for (const [bucket, paths] of Object.entries(groups)) {
    try {
      await removePaths(bucket as Bucket, paths)
      removed += paths.length
    } catch {
      failed += paths.length
    }
  }
  return { removed, failed }
}

/**
 * Löscht ein Werk samt aller Bilddateien (Hauptbild, Vorschau, weitere Bilder).
 * Zuerst wird der Datenbankeintrag gelöscht, danach die Dateien. Schlägt das Entfernen einzelner
 * Dateien fehl, bleibt das Werk gelöscht und die Zahl der übrig gebliebenen Dateien wird gemeldet.
 */
export async function deleteArtworkWithFiles(
  artworkId: string,
): Promise<RemovalResult> {
  const db = client()
  const { data: artwork, error: readError } = await db
    .from('artworks')
    .select('main_image_url, thumb_url')
    .eq('id', artworkId)
    .single()
  if (readError)
    throw new UploadError(
      'delete',
      `Werk nicht gefunden: ${readError.message}`,
      { cause: readError },
    )

  const { data: images, error: imagesError } = await db
    .from('artwork_images')
    .select('image_url, thumb_url')
    .eq('artwork_id', artworkId)
  if (imagesError)
    throw new UploadError(
      'delete',
      `Bilder nicht lesbar: ${imagesError.message}`,
      { cause: imagesError },
    )

  const urls = [
    artwork.main_image_url,
    artwork.thumb_url,
    ...(images ?? []).flatMap((image) => [image.image_url, image.thumb_url]),
  ]

  const { error: deleteError } = await db
    .from('artworks')
    .delete()
    .eq('id', artworkId)
  if (deleteError)
    throw new UploadError(
      'delete',
      `Werk nicht gelöscht: ${deleteError.message}`,
      { cause: deleteError },
    )

  return removeFilesByUrl(urls)
}

/** Löscht einen Presseeintrag samt Datei und Vorschaubild. */
export async function deletePressItemWithFiles(
  itemId: string,
): Promise<RemovalResult> {
  const db = client()
  const { data: item, error: readError } = await db
    .from('press_items')
    .select('file_url, thumbnail_url')
    .eq('id', itemId)
    .single()
  if (readError)
    throw new UploadError(
      'delete',
      `Eintrag nicht gefunden: ${readError.message}`,
      { cause: readError },
    )

  const { error: deleteError } = await db
    .from('press_items')
    .delete()
    .eq('id', itemId)
  if (deleteError)
    throw new UploadError(
      'delete',
      `Eintrag nicht gelöscht: ${deleteError.message}`,
      { cause: deleteError },
    )

  return removeFilesByUrl([item.file_url, item.thumbnail_url])
}
