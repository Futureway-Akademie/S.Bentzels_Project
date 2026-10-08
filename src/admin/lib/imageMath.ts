// Reine Rechenfunktionen für Bilder und Speicheradressen, ohne Browser- oder Netzwerkzugriff.

export const FULL_MAX_EDGE = 2400
export const THUMB_MAX_EDGE = 800
export const IMAGE_QUALITY = 0.85

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024
export const MAX_PDF_BYTES = 25 * 1024 * 1024

/** Bereich im Originalbild als Anteile (0 bis 1) von Breite und Höhe. */
export type CropRect = { x: number; y: number; width: number; height: number }

export type Size = { width: number; height: number }

/** Skaliert so, dass die längste Kante höchstens maxEdge beträgt. Es wird nie hochskaliert. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): Size {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Rechnet einen Bildausschnitt in Anteilen in Pixel um und begrenzt ihn auf das Bild. */
export function cropToPixels(width: number, height: number, crop: CropRect) {
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  const x = clamp(crop.x)
  const y = clamp(crop.y)
  const w = Math.min(clamp(crop.width), 1 - x)
  const h = Math.min(clamp(crop.height), 1 - y)
  return {
    sx: Math.round(x * width),
    sy: Math.round(y * height),
    sw: Math.max(1, Math.round(w * width)),
    sh: Math.max(1, Math.round(h * height)),
  }
}

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

/** Prüft die ersten Bytes auf die PDF-Kennung, unabhängig von Dateiname und Typangabe. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
  return signature.every((value, index) => bytes[index] === value)
}

export type StorageLocation = { bucket: string; path: string }

/** Zerlegt die öffentliche Adresse einer Datei in Bucket und Pfad. */
export function parsePublicUrl(
  url: string | null | undefined,
): StorageLocation | null {
  if (!url) return null
  try {
    const marker = '/storage/v1/object/public/'
    const pathname = new URL(url).pathname
    const index = pathname.indexOf(marker)
    if (index === -1) return null
    const rest = decodeURIComponent(pathname.slice(index + marker.length))
    const slash = rest.indexOf('/')
    if (slash <= 0 || slash === rest.length - 1) return null
    return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) }
  } catch {
    return null
  }
}

/** Gruppiert Adressen nach Bucket und entfernt Duplikate und fremde Adressen. */
export function groupByBucket(
  urls: (string | null | undefined)[],
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {}
  for (const url of urls) {
    const location = parsePublicUrl(url)
    if (!location) continue
    ;(groups[location.bucket] ??= new Set()).add(location.path)
  }
  return Object.fromEntries(
    Object.entries(groups).map(([bucket, paths]) => [bucket, [...paths]]),
  )
}

export function extensionFor(mime: string): string {
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'application/pdf') return 'pdf'
  return 'bin'
}
