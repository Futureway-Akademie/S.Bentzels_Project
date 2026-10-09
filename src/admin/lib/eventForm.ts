// Formular für eine Veranstaltung: Umwandlung, Prüfung, Termin-Hilfen (reine Funktionen).
// Pflicht ist nur der Titel. Leere Felder werden zu NULL, damit nichts Leeres gespeichert wird.
import { fromLocalInput, toLocalInput } from './postForm.ts'

export const EVENT_STATUSES = [
  'geplant',
  'anmeldung_moeglich',
  'wenige_plaetze',
  'ausgebucht',
  'verschoben',
  'abgesagt',
  'beendet',
  'archiviert',
] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export type RecurrenceRule = 'weekly' | 'biweekly' | 'monthly'

/** Ein weiterer Termin im Formular. Zeiten als Wert eines datetime-local-Feldes. */
export type EventDateValues = {
  /** Kennung in der Datenbank, null bei neuen Terminen */
  id: string | null
  /** Stabile Kennung für die Anzeige in der Liste */
  key: string
  starts_at: string
  ends_at: string
  note_de: string
  is_cancelled: boolean
}

export type EventFormValues = {
  title_de: string
  type_id: string
  category: string
  short_description_de: string
  description_de: string
  status: EventStatus
  is_published: boolean
  is_featured: boolean
  archive_visible: boolean
  starts_at: string
  ends_at: string
  show_time: boolean
  is_multi_day: boolean
  location_name: string
  location_address: string
  speaker_name: string
  capacity: string
  places_available: string
  price_eur: string
  price_on_request: boolean
  price_note_de: string
  registration_open: boolean
  registration_deadline: string
  /** Art der Anmeldung: nur Anfrage oder verbindlich mit Platzprüfung */
  registration_mode: 'anfrage' | 'verbindlich'
  audience_de: string
  requirements_de: string
  materials_de: string
  included_de: string
  contact_name: string
  contact_email: string
  contact_phone: string
  external_url: string
  pdf_label_de: string
  internal_note: string
  dates: EventDateValues[]
}

export type EventFormErrorCode =
  | 'required'
  | 'tooLong'
  | 'dateInvalid'
  | 'endBeforeStart'
  | 'numberInvalid'
  | 'priceInvalid'
  | 'placesExceed'
  | 'emailInvalid'
  | 'urlInvalid'

/** Schlüssel: Feldname oder `date:<key>` für einen weiteren Termin. */
export type EventFormErrors = Record<string, EventFormErrorCode>

/** Nur Felder der Tabelle events (ohne weitere Termine). */
export type EventPayload = {
  title_de: string
  type_id: string | null
  category: string | null
  short_description_de: string | null
  description_de: string | null
  status: EventStatus
  is_published: boolean
  is_featured: boolean
  archive_visible: boolean
  starts_at: string | null
  ends_at: string | null
  show_time: boolean
  is_multi_day: boolean
  location_name: string | null
  location_address: string | null
  speaker_name: string | null
  capacity: number | null
  places_available: number | null
  price_eur: number | null
  price_on_request: boolean
  price_note_de: string | null
  registration_open: boolean
  registration_deadline: string | null
  registration_mode: 'anfrage' | 'verbindlich'
  audience_de: string | null
  requirements_de: string | null
  materials_de: string | null
  included_de: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  external_url: string | null
  pdf_label_de: string | null
  internal_note: string | null
}

export type EventDatePayload = {
  starts_at: string
  ends_at: string | null
  note_de: string | null
  is_cancelled: boolean
}

export const TITLE_MAX = 200
export const SHORT_MAX = 500
export const TEXT_MAX = 10000
export const FIELD_MAX = 300
export const NOTE_MAX = 200

const num = (value: string): number | null | 'invalid' => {
  const text = value.trim()
  if (text === '') return null
  return /^\d{1,9}$/.test(text) ? Number(text) : 'invalid'
}

const price = (value: string): number | null | 'invalid' => {
  const text = value.trim().replace(',', '.')
  if (text === '') return null
  return /^\d{1,7}(\.\d{1,2})?$/.test(text) ? Number(text) : 'invalid'
}

const orNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim()

export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {}
  if (values.title_de.trim() === '') errors.title_de = 'required'
  else if (values.title_de.trim().length > TITLE_MAX)
    errors.title_de = 'tooLong'

  const limits: [keyof EventFormValues, number][] = [
    ['short_description_de', SHORT_MAX],
    ['description_de', TEXT_MAX],
    ['category', FIELD_MAX],
    ['location_name', FIELD_MAX],
    ['location_address', FIELD_MAX],
    ['speaker_name', FIELD_MAX],
    ['price_note_de', FIELD_MAX],
    ['audience_de', TEXT_MAX],
    ['requirements_de', TEXT_MAX],
    ['materials_de', TEXT_MAX],
    ['included_de', TEXT_MAX],
    ['contact_name', FIELD_MAX],
    ['contact_phone', 100],
    ['pdf_label_de', FIELD_MAX],
    ['internal_note', TEXT_MAX],
  ]
  for (const [key, max] of limits) {
    if (String(values[key]).trim().length > max) errors[key] = 'tooLong'
  }

  const start = fromLocalInput(values.starts_at)
  const end = fromLocalInput(values.ends_at)
  if (values.starts_at.trim() && start === null)
    errors.starts_at = 'dateInvalid'
  if (values.ends_at.trim() && end === null) errors.ends_at = 'dateInvalid'
  if (start && end && end < start) errors.ends_at = 'endBeforeStart'
  if (
    values.registration_deadline.trim() &&
    fromLocalInput(values.registration_deadline) === null
  )
    errors.registration_deadline = 'dateInvalid'

  const capacity = num(values.capacity)
  const places = num(values.places_available)
  if (capacity === 'invalid') errors.capacity = 'numberInvalid'
  if (places === 'invalid') errors.places_available = 'numberInvalid'
  if (
    typeof capacity === 'number' &&
    typeof places === 'number' &&
    places > capacity
  )
    errors.places_available = 'placesExceed'
  if (price(values.price_eur) === 'invalid') errors.price_eur = 'priceInvalid'

  const email = values.contact_email.trim()
  if (
    email &&
    (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    errors.contact_email = 'emailInvalid'
  const url = values.external_url.trim()
  if (url && !/^https?:\/\/\S+$/i.test(url)) errors.external_url = 'urlInvalid'

  for (const date of values.dates) {
    const s = fromLocalInput(date.starts_at)
    const e = fromLocalInput(date.ends_at)
    if (s === null) errors[`date:${date.key}`] = 'dateInvalid'
    else if (date.ends_at.trim() && e === null)
      errors[`date:${date.key}`] = 'dateInvalid'
    else if (e && e < s) errors[`date:${date.key}`] = 'endBeforeStart'
    else if (date.note_de.trim().length > NOTE_MAX)
      errors[`date:${date.key}`] = 'tooLong'
  }
  return errors
}

/** Nur nach erfolgreicher Prüfung. */
export function toEventPayload(values: EventFormValues): EventPayload {
  const capacity = num(values.capacity)
  const places = num(values.places_available)
  const cost = price(values.price_eur)
  return {
    title_de: values.title_de.trim(),
    type_id: values.type_id === '' ? null : values.type_id,
    category: orNull(values.category),
    short_description_de: orNull(values.short_description_de),
    description_de: orNull(values.description_de),
    status: values.status,
    is_published: values.is_published,
    is_featured: values.is_featured,
    archive_visible: values.archive_visible,
    starts_at: fromLocalInput(values.starts_at),
    ends_at: fromLocalInput(values.ends_at),
    show_time: values.show_time,
    is_multi_day: values.is_multi_day,
    location_name: orNull(values.location_name),
    location_address: orNull(values.location_address),
    speaker_name: orNull(values.speaker_name),
    capacity: typeof capacity === 'number' ? capacity : null,
    places_available: typeof places === 'number' ? places : null,
    price_eur: typeof cost === 'number' ? cost : null,
    price_on_request: values.price_on_request,
    price_note_de: orNull(values.price_note_de),
    registration_open: values.registration_open,
    registration_deadline: fromLocalInput(values.registration_deadline),
    registration_mode: values.registration_mode,
    audience_de: orNull(values.audience_de),
    requirements_de: orNull(values.requirements_de),
    materials_de: orNull(values.materials_de),
    included_de: orNull(values.included_de),
    contact_name: orNull(values.contact_name),
    contact_email: orNull(values.contact_email),
    contact_phone: orNull(values.contact_phone),
    external_url: orNull(values.external_url),
    pdf_label_de: orNull(values.pdf_label_de),
    internal_note: orNull(values.internal_note),
  }
}

export function toDatePayloads(values: EventFormValues): EventDatePayload[] {
  return values.dates.map((date) => ({
    starts_at: fromLocalInput(date.starts_at) ?? '',
    ends_at: fromLocalInput(date.ends_at),
    note_de: orNull(date.note_de),
    is_cancelled: date.is_cancelled,
  }))
}

export function eventFormFromRow(
  row: Partial<EventPayload>,
  dates: {
    id: string
    starts_at: string
    ends_at: string | null
    note_de: string | null
    is_cancelled: boolean
  }[] = [],
): EventFormValues {
  const text = (value: string | null | undefined) => value ?? ''
  const int = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)
  return {
    title_de: text(row.title_de),
    type_id: text(row.type_id),
    category: text(row.category),
    short_description_de: text(row.short_description_de),
    description_de: text(row.description_de),
    status: row.status ?? 'geplant',
    is_published: row.is_published ?? false,
    is_featured: row.is_featured ?? false,
    archive_visible: row.archive_visible ?? true,
    starts_at: toLocalInput(row.starts_at),
    ends_at: toLocalInput(row.ends_at),
    show_time: row.show_time ?? true,
    is_multi_day: row.is_multi_day ?? false,
    location_name: text(row.location_name),
    location_address: text(row.location_address),
    speaker_name: text(row.speaker_name),
    capacity: int(row.capacity),
    places_available: int(row.places_available),
    price_eur:
      row.price_eur === null || row.price_eur === undefined
        ? ''
        : String(row.price_eur).replace('.', ','),
    price_on_request: row.price_on_request ?? false,
    price_note_de: text(row.price_note_de),
    registration_open: row.registration_open ?? false,
    registration_deadline: toLocalInput(row.registration_deadline),
    registration_mode: row.registration_mode ?? 'anfrage',
    audience_de: text(row.audience_de),
    requirements_de: text(row.requirements_de),
    materials_de: text(row.materials_de),
    included_de: text(row.included_de),
    contact_name: text(row.contact_name),
    contact_email: text(row.contact_email),
    contact_phone: text(row.contact_phone),
    external_url: text(row.external_url),
    pdf_label_de: text(row.pdf_label_de),
    internal_note: text(row.internal_note),
    dates: dates.map((date) => ({
      id: date.id,
      key: date.id,
      starts_at: toLocalInput(date.starts_at),
      ends_at: toLocalInput(date.ends_at),
      note_de: text(date.note_de),
      is_cancelled: date.is_cancelled,
    })),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const toInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

/** Gleicher Tag im späteren Monat, bei kürzerem Monat der letzte Tag. */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const last = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate()
  result.setDate(Math.min(day, last))
  return result
}

/**
 * Erzeugt weitere Termine nach einem ersten Termin: jede Woche, alle zwei Wochen oder jeden Monat,
 * mit derselben Uhrzeit und Dauer. Liefert leer, wenn der Beginn fehlt oder ungültig ist.
 */
export function generateRecurrence(
  startsAt: string,
  endsAt: string,
  rule: RecurrenceRule,
  count: number,
): { starts_at: string; ends_at: string }[] {
  const start = fromLocalInput(startsAt)
  if (start === null || !Number.isInteger(count) || count < 1) return []
  const first = new Date(startsAt)
  const end = fromLocalInput(endsAt)
  const duration = end
    ? new Date(end).getTime() - new Date(start).getTime()
    : null
  const result: { starts_at: string; ends_at: string }[] = []
  for (let k = 1; k <= Math.min(count, 60); k += 1) {
    let next: Date
    if (rule === 'monthly') next = addMonths(first, k)
    else {
      next = new Date(first)
      next.setDate(next.getDate() + k * (rule === 'weekly' ? 7 : 14))
    }
    result.push({
      starts_at: toInput(next),
      ends_at:
        duration === null ? '' : toInput(new Date(next.getTime() + duration)),
    })
  }
  return result
}

/**
 * Verschiebt einen Termin auf einen neuen Tag (JJJJ-MM-TT). Uhrzeit und Dauer bleiben gleich.
 * Ohne Beginn wird 00:00 verwendet.
 */
export function shiftToDay(
  startsAt: string,
  endsAt: string,
  day: string,
): { starts_at: string; ends_at: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const time = /T(\d{2}:\d{2})/.exec(startsAt)?.[1] ?? '00:00'
  const nextStart = `${day}T${time}`
  const start = fromLocalInput(nextStart)
  if (start === null) return null
  const oldStart = fromLocalInput(startsAt)
  const oldEnd = fromLocalInput(endsAt)
  const duration =
    oldStart && oldEnd
      ? new Date(oldEnd).getTime() - new Date(oldStart).getTime()
      : null
  return {
    starts_at: nextStart,
    ends_at:
      duration === null
        ? ''
        : toInput(new Date(new Date(nextStart).getTime() + duration)),
  }
}

type Dated = { starts_at: string | null; ends_at: string | null }

/** Letzter Zeitpunkt der Veranstaltung über alle Termine, null ohne Datum. */
export function lastMoment(event: Dated, dates: Dated[]): number | null {
  const times: number[] = []
  for (const item of [event, ...dates]) {
    const value = item.ends_at ?? item.starts_at
    if (value) times.push(new Date(value).getTime())
  }
  return times.length === 0 ? null : Math.max(...times)
}

export type EventScope = 'upcoming' | 'past' | 'archive' | 'all'

/** Zuordnung zu den Reitern der Liste. Ohne Datum gilt eine Veranstaltung als kommend. */
export function scopeOf(
  event: Dated & { status: EventStatus },
  dates: Dated[],
  now: number,
): Exclude<EventScope, 'all'> {
  if (event.status === 'archiviert') return 'archive'
  const last = lastMoment(event, dates)
  if (event.status === 'beendet') return 'past'
  if (last !== null && last < now) return 'past'
  return 'upcoming'
}
