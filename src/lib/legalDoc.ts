// Rechtstexte (Impressum, Datenschutz) liegen als HTML in der Tabelle site_settings.
// Reine Funktionen, ohne Imports (in Node getestet).

export type LegalKind = 'imprint' | 'privacy'

export const LEGAL_KEYS: Record<LegalKind, string> = {
  imprint: 'legal_imprint',
  privacy: 'legal_privacy',
}

export type LegalDocs = Record<LegalKind, string>

/** Liest den gespeicherten Wert ({ html }) und ignoriert alles Unerwartete. */
export function parseLegalHtml(value: unknown): string {
  if (typeof value !== 'object' || value === null) return ''
  const html = (value as { html?: unknown }).html
  return typeof html === 'string' ? html.trim() : ''
}

export function legalDocsFromRows(
  rows: { key: string; value: unknown }[],
): LegalDocs {
  const docs: LegalDocs = { imprint: '', privacy: '' }
  for (const kind of Object.keys(LEGAL_KEYS) as LegalKind[]) {
    const row = rows.find((candidate) => candidate.key === LEGAL_KEYS[kind])
    docs[kind] = row ? parseLegalHtml(row.value) : ''
  }
  return docs
}

/** Ein Editor ohne Inhalt liefert <p></p>: das gilt als leer. */
export function isBlankHtml(html: string): boolean {
  return (
    html
      .replace(/<(?!img\b)[^>]*>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .trim() === ''
  )
}
