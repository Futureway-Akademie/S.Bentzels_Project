// Einfache Hilfen für HTML-Texte des Editors (ohne Browser, ohne Imports).

/** Alle Bildadressen (src) in einem HTML-Text, ohne Duplikate. */
export function extractImageUrls(html: string): string[] {
  const urls = new Set<string>()
  const pattern = /<img\b[^>]*?\bsrc\s*=\s*"([^"]+)"/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html)) !== null) urls.add(match[1])
  return [...urls]
}

/** Leerer Text (nur leere Absätze und Leerraum) und keine Bilder gilt als leer. */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true
  if (/<img\b/i.test(html)) return false
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
  return text === ''
}

/** Entfernt leere Absätze am Ende (der Editor hängt gern einen an). */
export function trimTrailingEmpty(html: string): string {
  return html.replace(/(?:\s*<p>(?:\s|<br\s*\/?>|&nbsp;)*<\/p>)+\s*$/gi, '')
}
