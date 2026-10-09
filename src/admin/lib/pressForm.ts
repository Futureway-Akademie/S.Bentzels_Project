// Formular für einen Presseeintrag (reine Funktionen, ohne Imports).
// Alle Angaben außer Datei oder Link sind optional. Leere Felder werden zu NULL.

export const MEDIUM_TYPES = ['zeitung', 'magazin', 'onlineportal'] as const
export type MediumType = (typeof MEDIUM_TYPES)[number]

export type PressFormValues = {
  title_de: string
  medium: string
  medium_type: '' | MediumType
  author: string
  /** JJJJ-MM-TT oder leer */
  published_at: string
  year: string
  /** Adresse (slug) der Kategorie oder leer */
  category: string
  summary_de: string
  description_de: string
  external_url: string
  is_highlight: boolean
  is_published: boolean
}

export type PressFormErrorCode =
  'tooLong' | 'yearInvalid' | 'dateInvalid' | 'urlInvalid' | 'needsSource'

export type PressFormErrors = Partial<
  Record<keyof PressFormValues, PressFormErrorCode>
>

export type PressPayload = {
  title_de: string | null
  medium: string | null
  medium_type: MediumType | null
  author: string | null
  published_at: string | null
  year: number | null
  category: string | null
  summary_de: string | null
  description_de: string | null
  external_url: string | null
  is_highlight: boolean
  is_published: boolean
}

const orNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim()

const validDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/**
 * Prüft das Formular. `hasFile` sagt, ob der Eintrag eine Datei besitzt: ohne Datei ist ein Link
 * Pflicht, mit Datei bleibt der Link optional.
 */
export function validatePressForm(
  values: PressFormValues,
  hasFile: boolean,
): PressFormErrors {
  const errors: PressFormErrors = {}
  const limits: [keyof PressFormValues, number][] = [
    ['title_de', 300],
    ['medium', 200],
    ['author', 200],
    ['summary_de', 2000],
    ['description_de', 10000],
  ]
  for (const [key, max] of limits)
    if (String(values[key]).trim().length > max) errors[key] = 'tooLong'
  if (values.published_at.trim() && !validDate(values.published_at.trim()))
    errors.published_at = 'dateInvalid'
  const year = values.year.trim()
  if (
    year &&
    !(/^\d{4}$/.test(year) && Number(year) >= 1000 && Number(year) <= 2999)
  )
    errors.year = 'yearInvalid'
  const url = values.external_url.trim()
  if (url && !/^https?:\/\/\S+$/i.test(url)) errors.external_url = 'urlInvalid'
  if (!url && !hasFile) errors.external_url = 'needsSource'
  return errors
}

/** Nur nach erfolgreicher Prüfung. Ohne Jahr gilt das Jahr des Datums. */
export function toPressPayload(values: PressFormValues): PressPayload {
  const date = orNull(values.published_at)
  const yearText = values.year.trim()
  const year = yearText
    ? Number(yearText)
    : date
      ? Number(date.slice(0, 4))
      : null
  return {
    title_de: orNull(values.title_de),
    medium: orNull(values.medium),
    medium_type: values.medium_type === '' ? null : values.medium_type,
    author: orNull(values.author),
    published_at: date,
    year,
    category: orNull(values.category),
    summary_de: orNull(values.summary_de),
    description_de: orNull(values.description_de),
    external_url: orNull(values.external_url),
    is_highlight: values.is_highlight,
    is_published: values.is_published,
  }
}

export function pressFormFromRow(
  row: Partial<{
    [K in keyof PressPayload]: PressPayload[K] | undefined
  }>,
): PressFormValues {
  const text = (v: string | null | undefined) => v ?? ''
  return {
    title_de: text(row.title_de),
    medium: text(row.medium),
    medium_type: row.medium_type ?? '',
    author: text(row.author),
    published_at: text(row.published_at),
    year: row.year === null || row.year === undefined ? '' : String(row.year),
    category: text(row.category),
    summary_de: text(row.summary_de),
    description_de: text(row.description_de),
    external_url: text(row.external_url),
    is_highlight: row.is_highlight ?? false,
    is_published: row.is_published ?? false,
  }
}

/** Endung eines Dateinamens ohne Punkt, klein. */
export function fileKind(file: {
  name: string
  type: string
}): 'image' | 'pdf' | null {
  if (file.type === 'application/pdf') return 'pdf'
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'image'
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'pdf'
  if (ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image'
  return null
}
