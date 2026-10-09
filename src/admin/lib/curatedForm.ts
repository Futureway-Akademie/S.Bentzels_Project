// Formular für einen empfohlenen Artikel (reine Funktionen, ohne Imports).
// Nur der Link ist Pflicht. Titel, Quelle, Notiz und Vorschaubild sind optional.

export type CuratedFormValues = {
  url: string
  title_de: string
  source: string
  note_de: string
}

export type CuratedFormErrorCode = 'required' | 'urlInvalid' | 'tooLong'
export type CuratedFormErrors = Partial<
  Record<keyof CuratedFormValues, CuratedFormErrorCode>
>

export type CuratedPayload = {
  url: string
  title_de: string | null
  source: string | null
  note_de: string | null
}

/** Ob der Text eine vollständige Web-Adresse mit http oder https ist. */
export function isWebUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim())
}

export function validateCuratedForm(
  values: CuratedFormValues,
): CuratedFormErrors {
  const errors: CuratedFormErrors = {}
  if (values.url.trim() === '') errors.url = 'required'
  else if (!isWebUrl(values.url)) errors.url = 'urlInvalid'
  else if (values.url.trim().length > 2000) errors.url = 'tooLong'
  if (values.title_de.trim().length > 300) errors.title_de = 'tooLong'
  if (values.source.trim().length > 200) errors.source = 'tooLong'
  if (values.note_de.trim().length > 2000) errors.note_de = 'tooLong'
  return errors
}

const orNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim()

export function toCuratedPayload(values: CuratedFormValues): CuratedPayload {
  return {
    url: values.url.trim(),
    title_de: orNull(values.title_de),
    source: orNull(values.source),
    note_de: orNull(values.note_de),
  }
}

export function curatedFormFromRow(
  row: Partial<{ [K in keyof CuratedPayload]: CuratedPayload[K] | undefined }>,
): CuratedFormValues {
  return {
    url: row.url ?? '',
    title_de: row.title_de ?? '',
    source: row.source ?? '',
    note_de: row.note_de ?? '',
  }
}

/** Domain einer Adresse ohne „www.“, als Anzeige, wenn kein Titel vorhanden ist. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
