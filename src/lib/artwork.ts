import type { Artwork } from '../data'

export function hasDimensions(a: Artwork): boolean {
  return a.heightCm != null && a.widthCm != null
}

/** Alt-Text: der Wert aus dem Dashboard, sonst aus vorhandenen Angaben ohne leere Teile. Das Jahr nur, wenn es öffentlich sichtbar ist. */
export function artworkAlt(
  a: Artwork,
  fallback: string,
  includeYear = true,
): string {
  // Ein im Dashboard hinterlegter Alt-Text hat Vorrang
  if (a.altTextDe?.trim()) return a.altTextDe.trim()
  return [a.titleDe ?? fallback, includeYear ? a.year : null]
    .filter((part) => part != null && part !== '')
    .join(', ')
}
