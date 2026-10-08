// Formular für ein Werk: Umwandlung und Prüfung (reine Funktionen, ohne Imports).
// Alle Angaben sind optional. Leere Felder werden zu NULL, damit nichts Leeres gespeichert wird.

export type ArtworkStatus = 'verfuegbar' | 'reserviert' | 'verkauft'

export type ArtworkFormValues = {
  title_de: string
  title_en: string
  artist: string
  cycle: string
  year: string
  technique_de: string
  technique_en: string
  support_de: string
  height_cm: string
  width_cm: string
  depth_cm: string
  framed: '' | 'ja' | 'nein'
  is_multipart: boolean
  price_eur: string
  status: '' | ArtworkStatus
  description_de: string
  description_en: string
  alt_text_de: string
  is_highlight: boolean
  is_published: boolean
}

export type ArtworkFormErrorCode =
  | 'tooLong'
  | 'yearInvalid'
  | 'numberInvalid'
  | 'numberPositive'
  | 'priceInvalid'

export type ArtworkFormErrors = Partial<
  Record<keyof ArtworkFormValues, ArtworkFormErrorCode>
>

export type ArtworkPayload = {
  title_de: string | null
  title_en: string | null
  artist: string | null
  cycle: string | null
  year: number | null
  technique_de: string | null
  technique_en: string | null
  support_de: string | null
  height_cm: number | null
  width_cm: number | null
  depth_cm: number | null
  framed: boolean | null
  is_multipart: boolean
  price_eur: number | null
  status: ArtworkStatus | null
  description_de: string | null
  description_en: string | null
  alt_text_de: string | null
  is_highlight: boolean
  is_published: boolean
}

const SHORT_FIELDS = [
  'title_de',
  'title_en',
  'artist',
  'cycle',
  'technique_de',
  'technique_en',
  'support_de',
] as const
const LONG_FIELDS = ['description_de', 'description_en', 'alt_text_de'] as const
export const SHORT_MAX = 200
export const LONG_MAX = 5000

const text = (value: string) => value.trim()

/** Zahl mit Komma oder Punkt als Dezimaltrenner. Leer = null, ungültig = NaN. */
export function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return null
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

export function validateArtworkForm(
  values: ArtworkFormValues,
): ArtworkFormErrors {
  const errors: ArtworkFormErrors = {}
  for (const key of SHORT_FIELDS)
    if (text(values[key]).length > SHORT_MAX) errors[key] = 'tooLong'
  for (const key of LONG_FIELDS)
    if (text(values[key]).length > LONG_MAX) errors[key] = 'tooLong'

  const year = text(values.year)
  if (year !== '') {
    const n = Number(year)
    if (!/^\d{4}$/.test(year) || n < 1000 || n > 2999)
      errors.year = 'yearInvalid'
  }

  for (const key of ['height_cm', 'width_cm', 'depth_cm'] as const) {
    const n = parseNumber(values[key])
    if (n !== null && Number.isNaN(n)) errors[key] = 'numberInvalid'
    else if (n !== null && n <= 0) errors[key] = 'numberPositive'
  }

  const price = parseNumber(values.price_eur)
  if (price !== null && (Number.isNaN(price) || price < 0))
    errors.price_eur = 'priceInvalid'
  return errors
}

const orNull = (value: string) => (text(value) === '' ? null : text(value))

/** Nur aufrufen, wenn validateArtworkForm keine Fehler meldet. */
export function toPayload(values: ArtworkFormValues): ArtworkPayload {
  return {
    title_de: orNull(values.title_de),
    title_en: orNull(values.title_en),
    artist: orNull(values.artist),
    cycle: orNull(values.cycle),
    year: text(values.year) === '' ? null : Number(text(values.year)),
    technique_de: orNull(values.technique_de),
    technique_en: orNull(values.technique_en),
    support_de: orNull(values.support_de),
    height_cm: parseNumber(values.height_cm),
    width_cm: parseNumber(values.width_cm),
    depth_cm: parseNumber(values.depth_cm),
    framed: values.framed === '' ? null : values.framed === 'ja',
    is_multipart: values.is_multipart,
    price_eur: parseNumber(values.price_eur),
    status: values.status === '' ? null : values.status,
    description_de: orNull(values.description_de),
    description_en: orNull(values.description_en),
    alt_text_de: orNull(values.alt_text_de),
    is_highlight: values.is_highlight,
    is_published: values.is_published,
  }
}

type Row = {
  [K in keyof ArtworkPayload]?: ArtworkPayload[K] | undefined
}

const str = (value: string | null | undefined) => value ?? ''
const num = (value: number | null | undefined) =>
  value == null ? '' : String(value).replace('.', ',')

/** Formularwerte aus einer Datenbankzeile. */
export function fromRow(row: Row): ArtworkFormValues {
  return {
    title_de: str(row.title_de),
    title_en: str(row.title_en),
    artist: str(row.artist),
    cycle: str(row.cycle),
    year: row.year == null ? '' : String(row.year),
    technique_de: str(row.technique_de),
    technique_en: str(row.technique_en),
    support_de: str(row.support_de),
    height_cm: num(row.height_cm),
    width_cm: num(row.width_cm),
    depth_cm: num(row.depth_cm),
    framed: row.framed == null ? '' : row.framed ? 'ja' : 'nein',
    is_multipart: Boolean(row.is_multipart),
    price_eur: num(row.price_eur),
    status: row.status ?? '',
    description_de: str(row.description_de),
    description_en: str(row.description_en),
    alt_text_de: str(row.alt_text_de),
    is_highlight: Boolean(row.is_highlight),
    is_published: Boolean(row.is_published),
  }
}
