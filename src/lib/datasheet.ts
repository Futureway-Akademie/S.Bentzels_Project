// Werkblatt: aus den Werkdaten wird eine Liste aus Beschriftung und Wert (reine Funktionen, ohne
// Imports). Fehlende Angaben erzeugen keine Zeilen. Dieselben Funktionen dienen der öffentlichen
// Fassung (Daten aus artworks_public, ausgeblendete Angaben sind dort bereits leer) und der
// internen Vollversion im Dashboard (alle Angaben aus der Tabelle artworks).

export type DatasheetInput = {
  title: string | null
  artist: string | null
  cycle: string | null
  year: number | null
  technique: string | null
  support: string | null
  heightCm: number | null
  widthCm: number | null
  depthCm: number | null
  framed: boolean | null
  status: 'verfuegbar' | 'reserviert' | 'verkauft' | null
  priceEur: number | null
  description: string | null
}

export type DatasheetLabels = {
  untitled: string
  artist: string
  cycle: string
  year: string
  technique: string
  support: string
  dimensions: string
  framed: string
  yes: string
  no: string
  status: string
  price: string
  statusNames: Record<'verfuegbar' | 'reserviert' | 'verkauft', string>
  formatDimensions: (
    height: number,
    width: number,
    depth: number | null,
  ) => string
  /** Endpreis mit Hinweis, z. B. „6.230 € inkl. MwSt.“ */
  formatPrice: (value: number) => string
}

export type Datasheet = {
  title: string
  rows: [label: string, value: string][]
  description: string | null
}

const filled = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

export function buildDatasheet(
  input: DatasheetInput,
  labels: DatasheetLabels,
): Datasheet {
  const rows: [string, string][] = []
  const add = (label: string, value: string | null | undefined) => {
    if (filled(value)) rows.push([label, value.trim()])
  }
  add(labels.artist, input.artist)
  add(labels.cycle, input.cycle)
  if (input.year != null) add(labels.year, String(input.year))
  add(labels.technique, input.technique)
  add(labels.support, input.support)
  if (input.heightCm != null && input.widthCm != null)
    add(
      labels.dimensions,
      labels.formatDimensions(input.heightCm, input.widthCm, input.depthCm),
    )
  if (input.framed != null)
    add(labels.framed, input.framed ? labels.yes : labels.no)
  if (input.status) add(labels.status, labels.statusNames[input.status])
  if (input.priceEur != null)
    add(labels.price, labels.formatPrice(input.priceEur))
  return {
    title: filled(input.title) ? input.title.trim() : labels.untitled,
    rows,
    description: filled(input.description) ? input.description.trim() : null,
  }
}

/** Teilt Text in Zeilen, die höchstens `max` breit sind (Breite über `measure`). Absätze bleiben erhalten. */
export function wrapText(
  text: string,
  max: number,
  measure: (value: string) => number,
): string[] {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = current ? `${current} ${word}` : word
      if (measure(next) <= max || !current) current = next
      else {
        lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

/** Dateiname des Werkblatts aus dem Kurznamen des Werks. */
export function datasheetFileName(slug: string | null | undefined): string {
  const clean = (slug ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `werkblatt-${clean || 'werk'}.pdf`
}
