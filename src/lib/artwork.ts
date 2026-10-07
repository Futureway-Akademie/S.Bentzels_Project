import type { Artwork } from '../data'

export function hasDimensions(a: Artwork): boolean {
  return a.heightCm != null && a.widthCm != null
}

/** Alt-Text aus vorhandenen Angaben, ohne leere Teile. Das Jahr nur, wenn es öffentlich sichtbar ist. */
export function artworkAlt(
  a: Artwork,
  fallback: string,
  includeYear = true,
): string {
  return [a.titleDe ?? fallback, includeYear ? a.year : null]
    .filter((part) => part != null && part !== '')
    .join(', ')
}
