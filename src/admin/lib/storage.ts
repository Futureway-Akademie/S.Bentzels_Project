import { supabase } from '../../lib/supabase'
import { pdfFirstPageThumbnail } from './pdfThumbnail'
import {
  groupByBucket,
  looksLikePdf,
  MAX_PDF_BYTES,
  parsePublicUrl,
} from './imageMath'
import { parseVariants, type ImageVariant } from '../../lib/imageVariants'
import { processImage, processThumb, type EncodedImage } from './images'
import { UploadError } from './uploadError'

export type Bucket = 'artworks' | 'posts' | 'events' | 'people' | 'press'

export type StoredImage = {
  url: string
  thumbUrl: string
  width: number
  height: number
  thumbWidth: number
  thumbHeight: number
  /** Zusätzliche Fassungen für srcset (800 und 1600 px), leer bei kleinen Bildern. */
  variants: ImageVariant[]
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
  variants: EncodedImage[] = [],
): Promise<StoredImage> {
  const fullPath = `${folder}/${id}.${full.ext}`
  const thumbPath = `${folder}/${id}-800.${thumb.ext}`
  // Die Fassung für srcset heißt -w<Breite>, damit sie nicht mit der Vorschau (-800) kollidiert
  const variantPaths = variants.map(
    (variant) => `${folder}/${id}-w${variant.width}.${variant.ext}`,
  )
  const all = [fullPath, thumbPath, ...variantPaths]
  try {
    const [url, thumbUrl, ...variantUrls] = await Promise.all([
      put(bucket, fullPath, full.blob, full.mime),
      put(bucket, thumbPath, thumb.blob, thumb.mime),
      ...variants.map((variant, index) =>
        put(bucket, variantPaths[index], variant.blob, variant.mime),
      ),
    ])
    return {
      url,
      thumbUrl,
      width: full.width,
      height: full.height,
      thumbWidth: thumb.width,
      thumbHeight: thumb.height,
      variants: variants.map((variant, index) => ({
        url: variantUrls[index],
        width: variant.width,
      })),
      paths: all,
    }
  } catch (error) {
    // Nichts Halbes zurücklassen
    await removePaths(bucket, all).catch(() => undefined)
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
  // Zusätzliche Größen für srcset gibt es nur bei Werkbildern
  const { full, thumb, variants } = await processImage(file, {
    ...options,
    variants: bucket === 'artworks',
  })
  return putPair(bucket, folder, crypto.randomUUID(), full, thumb, variants)
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

/** Lädt ein PDF unverändert hoch (höchstens 25 MB). Die Datei wird auf die PDF-Kennung geprüft. */
export async function uploadPdf(
  bucket: Bucket,
  folder: string,
  file: File,
): Promise<{ url: string; path: string }> {
  if (file.size > MAX_PDF_BYTES)
    throw new UploadError('size', 'PDF ist größer als 25 MB')
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (!looksLikePdf(head))
    throw new UploadError('type', 'Die Datei ist kein gültiges PDF')
  const path = `${folder}/${crypto.randomUUID()}.pdf`
  const url = await put(bucket, path, file, 'application/pdf')
  return { url, path }
}

export type StoredThumb = {
  url: string
  width: number
  height: number
  path: string
}

/** Erzeugt aus einem vorhandenen Bild eine neue Vorschau (optional mit Bildausschnitt) und lädt sie hoch. */
export async function uploadThumbFromUrl(
  bucket: Bucket,
  folder: string,
  sourceUrl: string,
  crop?: Parameters<typeof processThumb>[1],
): Promise<StoredThumb> {
  const response = await fetch(sourceUrl)
  if (!response.ok)
    throw new UploadError(
      'decode',
      `Bild nicht erreichbar (${response.status})`,
    )
  const blob = await response.blob()
  const file = new File([blob], 'quelle', { type: blob.type || 'image/webp' })
  const thumb = await processThumb(file, crop)
  const path = `${folder}/${crypto.randomUUID()}-800.${thumb.ext}`
  const url = await put(bucket, path, thumb.blob, thumb.mime)
  return { url, width: thumb.width, height: thumb.height, path }
}

/** Kopiert eine Datei im selben Bucket und liefert die neue öffentliche Adresse. */
export async function copyFileByUrl(
  url: string,
  newFolder: string,
): Promise<string> {
  const location = parsePublicUrl(url)
  if (!location) throw new UploadError('upload', 'Dateiadresse nicht erkannt')
  const name = location.path.split('/').pop() ?? 'datei'
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const suffix = name.includes('-800.') ? '-800' : ''
  const target = `${newFolder}/${crypto.randomUUID()}${suffix}${ext}`
  const storage = client().storage.from(location.bucket)
  const { error } = await storage.copy(location.path, target)
  if (error)
    throw new UploadError(
      'upload',
      `Kopieren fehlgeschlagen: ${error.message}`,
      { cause: error },
    )
  return storage.getPublicUrl(target).data.publicUrl
}

/** Dateien direkt in einem Ordner eines Buckets (ohne Unterordner). */
export async function listFolder(
  bucket: Bucket,
  folder: string,
): Promise<string[]> {
  const { data, error } = await client()
    .storage.from(bucket)
    .list(folder, { limit: 1000 })
  if (error)
    throw new UploadError('delete', `Ordner nicht lesbar: ${error.message}`, {
      cause: error,
    })
  return (data ?? [])
    .filter((item) => item.id)
    .map((item) => `${folder}/${item.name}`)
}

/** Löscht alle Dateien eines Ordners. */
export async function removeFolder(
  bucket: Bucket,
  folder: string,
): Promise<RemovalResult> {
  const paths = await listFolder(bucket, folder)
  try {
    await removePaths(bucket, paths)
    return { removed: paths.length, failed: 0 }
  } catch {
    return { removed: 0, failed: paths.length }
  }
}

/** Entfernt Dateien eines Ordners, auf die kein Text mehr verweist. */
export async function removeUnusedInFolder(
  bucket: Bucket,
  folder: string,
  usedUrls: (string | null | undefined)[],
): Promise<RemovalResult> {
  const used = new Set(
    (groupByBucket(usedUrls)[bucket] ?? []).map((path) => path),
  )
  const unused = (await listFolder(bucket, folder)).filter(
    (path) => !used.has(path),
  )
  try {
    await removePaths(bucket, unused)
    return { removed: unused.length, failed: 0 }
  } catch {
    return { removed: 0, failed: unused.length }
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
    .select('main_image_url, thumb_url, image_variants')
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
    .select('image_url, thumb_url, image_variants')
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
    ...parseVariants(artwork.image_variants).map((variant) => variant.url),
    ...(images ?? []).flatMap((image) => [
      image.image_url,
      image.thumb_url,
      ...parseVariants(image.image_variants).map((variant) => variant.url),
    ]),
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
