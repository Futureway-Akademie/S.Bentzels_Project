// Formular für einen Journalbeitrag (reine Funktionen, ohne Imports).

export type PostStatus = 'entwurf' | 'veroeffentlicht'

export type PostFormValues = {
  title_de: string
  excerpt_de: string
  status: PostStatus
  /** Wert eines datetime-local-Feldes (lokale Zeit), leer = kein Datum */
  published_at: string
}

export type PostFormErrorCode = 'tooLong' | 'dateInvalid'
export type PostFormErrors = Partial<
  Record<keyof PostFormValues, PostFormErrorCode>
>

export type PostPayload = {
  title_de: string | null
  excerpt_de: string | null
  status: PostStatus
  published_at: string | null
}

export const TITLE_MAX = 200
export const EXCERPT_MAX = 500

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO-Zeitpunkt für ein datetime-local-Feld (lokale Zeit). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Wert eines datetime-local-Feldes als ISO-Zeitpunkt, ungültig = null. */
export function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function validatePostForm(values: PostFormValues): PostFormErrors {
  const errors: PostFormErrors = {}
  if (values.title_de.trim().length > TITLE_MAX) errors.title_de = 'tooLong'
  if (values.excerpt_de.trim().length > EXCERPT_MAX)
    errors.excerpt_de = 'tooLong'
  if (
    values.published_at.trim() &&
    fromLocalInput(values.published_at) === null
  )
    errors.published_at = 'dateInvalid'
  return errors
}

/** Nur nach erfolgreicher Prüfung. Wer veröffentlicht, ohne Datum zu setzen, erhält den Zeitpunkt jetzt. */
export function toPostPayload(
  values: PostFormValues,
  now: Date = new Date(),
): PostPayload {
  let publishedAt = fromLocalInput(values.published_at)
  if (values.status === 'veroeffentlicht' && publishedAt === null)
    publishedAt = now.toISOString()
  return {
    title_de: values.title_de.trim() === '' ? null : values.title_de.trim(),
    excerpt_de:
      values.excerpt_de.trim() === '' ? null : values.excerpt_de.trim(),
    status: values.status,
    published_at: publishedAt,
  }
}

export function postFormFromRow(row: {
  title_de?: string | null
  excerpt_de?: string | null
  status?: PostStatus | null
  published_at?: string | null
}): PostFormValues {
  return {
    title_de: row.title_de ?? '',
    excerpt_de: row.excerpt_de ?? '',
    status: row.status ?? 'entwurf',
    published_at: toLocalInput(row.published_at),
  }
}
