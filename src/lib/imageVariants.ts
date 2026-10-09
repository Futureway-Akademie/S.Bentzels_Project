// Bildgrößen für srcset (reine Funktionen, ohne Imports). Zu jedem Bild gibt es die Hauptdatei
// (höchstens 2400 px) und, falls das Bild groß genug ist, Fassungen mit 800 und 1600 px.

export type ImageVariant = { url: string; width: number }

/** Kantenlängen der zusätzlichen Fassungen (die Hauptdatei hat höchstens 2400 px). */
export const VARIANT_EDGES = [800, 1600] as const

/** Liest die gespeicherte Liste und ignoriert Einträge, die nicht passen. */
export function parseVariants(value: unknown): ImageVariant[] {
  if (!Array.isArray(value)) return []
  const result: ImageVariant[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const { url, width } = entry as { url?: unknown; width?: unknown }
    if (typeof url !== 'string' || url === '') continue
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0)
      continue
    result.push({ url, width: Math.round(width) })
  }
  return result.sort((a, b) => a.width - b.width)
}

/**
 * Welche zusätzlichen Fassungen entstehen: nur solche, die kleiner sind als die längste Kante
 * der Hauptdatei (hochskaliert wird nie).
 */
export function variantEdgesFor(width: number, height: number): number[] {
  const longest = Math.max(width, height)
  return VARIANT_EDGES.filter((edge) => edge < longest)
}

/**
 * Wert für das Attribut srcset. Ohne zusätzliche Fassungen oder ohne bekannte Breite der
 * Hauptdatei gibt es keine Liste (dann lädt der Browser einfach `src`). Alle Fassungen zeigen
 * dasselbe Bild im selben Seitenverhältnis, die Breite dient als w-Angabe.
 */
export function buildSrcSet(
  mainUrl: string,
  mainWidth: number | null | undefined,
  variants: ImageVariant[],
): string | undefined {
  if (!mainWidth || mainWidth <= 0) return undefined
  const smaller = variants.filter(
    (variant) => variant.width < mainWidth && variant.url !== mainUrl,
  )
  if (smaller.length === 0) return undefined
  return [...smaller, { url: mainUrl, width: mainWidth }]
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(', ')
}
