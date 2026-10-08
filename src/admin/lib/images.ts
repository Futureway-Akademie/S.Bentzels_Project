import {
  cropToPixels,
  extensionFor,
  fitWithin,
  FULL_MAX_EDGE,
  IMAGE_QUALITY,
  isAllowedImageType,
  MAX_IMAGE_BYTES,
  THUMB_MAX_EDGE,
  type CropRect,
} from './imageMath'
import { UploadError } from './uploadError'

export type EncodedImage = {
  blob: Blob
  width: number
  height: number
  mime: string
  ext: string
}

export type ProcessedImage = {
  /** Originalbild, höchstens 2400 px an der längsten Kante, als WebP. */
  full: EncodedImage
  /** Vorschaubild, höchstens 800 px, optional aus einem gewählten Bildausschnitt. */
  thumb: EncodedImage
}

type Source = ImageBitmap | HTMLCanvasElement

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function toBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

/** Zeichnet einen Ausschnitt der Quelle in neuer Größe. */
function render(
  source: Source,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) throw new UploadError('encode', 'Canvas nicht verfügbar')
  if (background) {
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height)
  return canvas
}

/**
 * Kodiert als WebP. Browser ohne WebP-Kodierung (ältere Safari-Versionen) liefern stattdessen PNG,
 * dann wird auf JPEG mit weißem Hintergrund ausgewichen.
 */
async function encode(
  source: Source,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  width: number,
  height: number,
): Promise<EncodedImage> {
  const webp = await toBlob(
    render(source, sx, sy, sw, sh, width, height),
    'image/webp',
    IMAGE_QUALITY,
  )
  if (webp && webp.type === 'image/webp') {
    return {
      blob: webp,
      width,
      height,
      mime: 'image/webp',
      ext: extensionFor('image/webp'),
    }
  }
  const jpeg = await toBlob(
    render(source, sx, sy, sw, sh, width, height, '#ffffff'),
    'image/jpeg',
    IMAGE_QUALITY,
  )
  if (!jpeg)
    throw new UploadError('encode', 'Bild konnte nicht umgewandelt werden')
  return {
    blob: jpeg,
    width,
    height,
    mime: 'image/jpeg',
    ext: extensionFor('image/jpeg'),
  }
}

/** Prüft Dateityp und Größe, bevor etwas verarbeitet wird. */
export function validateImageFile(file: File): void {
  if (!isAllowedImageType(file.type)) {
    throw new UploadError(
      'type',
      `Dateityp nicht erlaubt: ${file.type || 'unbekannt'}`,
    )
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError('size', 'Bilddatei ist größer als 50 MB')
  }
}

/**
 * Verkleinert ein Bild auf höchstens 2400 px, wandelt es in WebP um und erzeugt ein Vorschaubild
 * mit höchstens 800 px. Die Drehung aus den Kameradaten wird übernommen. Das Original bleibt
 * unverändert, ein Bildausschnitt wirkt nur auf das Vorschaubild.
 */
export async function processImage(
  file: File,
  options: { crop?: CropRect } = {},
): Promise<ProcessedImage> {
  validateImageFile(file)

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (cause) {
    throw new UploadError('decode', 'Bild konnte nicht gelesen werden', {
      cause,
    })
  }

  try {
    const fullSize = fitWithin(bitmap.width, bitmap.height, FULL_MAX_EDGE)
    const full = await encode(
      bitmap,
      0,
      0,
      bitmap.width,
      bitmap.height,
      fullSize.width,
      fullSize.height,
    )

    let thumb: EncodedImage
    if (options.crop) {
      const { sx, sy, sw, sh } = cropToPixels(
        bitmap.width,
        bitmap.height,
        options.crop,
      )
      const size = fitWithin(sw, sh, THUMB_MAX_EDGE)
      thumb = await encode(bitmap, sx, sy, sw, sh, size.width, size.height)
    } else {
      const size = fitWithin(fullSize.width, fullSize.height, THUMB_MAX_EDGE)
      thumb = await encode(
        bitmap,
        0,
        0,
        bitmap.width,
        bitmap.height,
        size.width,
        size.height,
      )
    }
    return { full, thumb }
  } finally {
    bitmap.close()
  }
}

/** Wandelt eine fertig gezeichnete Fläche (z. B. PDF-Seite) in ein Vorschaubild um. */
export async function encodeCanvasAsThumb(
  canvas: HTMLCanvasElement,
): Promise<EncodedImage> {
  const size = fitWithin(canvas.width, canvas.height, THUMB_MAX_EDGE)
  return encode(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    size.width,
    size.height,
  )
}

/** Erzeugt nur ein Vorschaubild (höchstens 800 px), optional aus einem Bildausschnitt. */
export async function processThumb(
  file: File,
  crop?: CropRect,
): Promise<EncodedImage> {
  validateImageFile(file)
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (cause) {
    throw new UploadError('decode', 'Bild konnte nicht gelesen werden', {
      cause,
    })
  }
  try {
    const area = crop
      ? cropToPixels(bitmap.width, bitmap.height, crop)
      : { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height }
    const size = fitWithin(area.sw, area.sh, THUMB_MAX_EDGE)
    return await encode(
      bitmap,
      area.sx,
      area.sy,
      area.sw,
      area.sh,
      size.width,
      size.height,
    )
  } finally {
    bitmap.close()
  }
}
