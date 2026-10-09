// Logik für den öffentlichen Veranstaltungskalender (reine Funktionen, ohne Imports).
// Zeiten werden in der Zeitzone des Besuchers gerechnet.

export type PublicStatus =
  | 'geplant'
  | 'anmeldung_moeglich'
  | 'wenige_plaetze'
  | 'ausgebucht'
  | 'verschoben'
  | 'abgesagt'
  | 'beendet'
  | 'archiviert'

/** Eine Veranstaltung aus der öffentlichen Sicht events_public. Fehlendes ist null. */
export type PublicEvent = {
  id: string
  slug: string
  typeId: string | null
  category: string | null
  status: PublicStatus
  isFeatured: boolean
  titleDe: string
  shortDescriptionDe: string | null
  descriptionDe: string | null
  recapTextDe: string | null
  startsAt: string | null
  endsAt: string | null
  showTime: boolean
  isMultiDay: boolean
  imageUrl: string | null
  imageThumbUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  registrationOpen: boolean
  registrationDeadline: string | null
  /** „anfrage“: Informationen anfragen, „verbindlich“: Anmeldung mit Platzprüfung */
  registrationMode: 'anfrage' | 'verbindlich'
  audienceDe: string | null
  requirementsDe: string | null
  materialsDe: string | null
  includedDe: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  pdfUrl: string | null
  pdfLabelDe: string | null
  externalUrl: string | null
  locationName: string | null
  locationAddress: string | null
  speakerName: string | null
  capacity: number | null
  placesAvailable: number | null
  priceEur: number | null
  priceOnRequest: boolean | null
  priceNoteDe: string | null
}

/** Ein Termin aus event_occurrences (erster oder weiterer Termin einer Veranstaltung). */
export type Occurrence = {
  eventId: string
  slug: string
  titleDe: string
  typeId: string | null
  status: PublicStatus
  isFeatured: boolean
  startsAt: string
  endsAt: string | null
  showTime: boolean
  isCancelled: boolean
  noteDe: string | null
  isFirst: boolean
}

export type EventFilters = {
  typeId: string
  /** JJJJ-MM */
  month: string
  place: string
  speaker: string
  availability: '' | 'open' | 'full'
}

export const emptyFilters: EventFilters = {
  typeId: '',
  month: '',
  place: '',
  speaker: '',
  availability: '',
}

export const hasFilters = (filters: EventFilters): boolean =>
  Object.values(filters).some((value) => value !== '')

const DAY = 24 * 60 * 60 * 1000
const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const monthKey = (iso: string): string =>
  dayKey(new Date(iso)).slice(0, 7)

export function isFull(event: PublicEvent): boolean {
  return event.status === 'ausgebucht' || event.placesAvailable === 0
}

/** Letzter Zeitpunkt über alle Termine, null ohne Datum. */
export function lastMoment(
  event: Pick<PublicEvent, 'startsAt' | 'endsAt'>,
  occurrences: Pick<Occurrence, 'startsAt' | 'endsAt'>[],
): number | null {
  const times: number[] = []
  for (const item of [event, ...occurrences]) {
    const value = item.endsAt ?? item.startsAt
    if (value) times.push(new Date(value).getTime())
  }
  return times.length === 0 ? null : Math.max(...times)
}

/** Vergangen: beendet oder archiviert, oder der letzte Termin liegt mehr als einen Tag zurück. */
export function isPastEvent(
  event: PublicEvent,
  occurrences: Occurrence[],
  now: number,
): boolean {
  if (event.status === 'beendet' || event.status === 'archiviert') return true
  const last = lastMoment(
    event,
    occurrences.filter((o) => o.eventId === event.id),
  )
  return last !== null && last < now - DAY
}

/** Ein Termin gilt bis zu seinem Ende, ohne Ende bis zum Ablauf des Tages. */
export function isUpcomingOccurrence(
  occurrence: Occurrence,
  now: number,
): boolean {
  if (occurrence.endsAt) return new Date(occurrence.endsAt).getTime() >= now
  const start = new Date(occurrence.startsAt)
  const endOfDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 1,
  ).getTime()
  return endOfDay > now
}

const byStart = (a: Occurrence, b: Occurrence) =>
  a.startsAt.localeCompare(b.startsAt) || a.titleDe.localeCompare(b.titleDe)

export function upcomingOccurrences(
  occurrences: Occurrence[],
  now: number,
): Occurrence[] {
  return occurrences.filter((o) => isUpcomingOccurrence(o, now)).sort(byStart)
}

export function matchesFilters(
  event: PublicEvent,
  filters: EventFilters,
): boolean {
  if (filters.typeId && event.typeId !== filters.typeId) return false
  if (filters.place && event.locationName !== filters.place) return false
  if (filters.speaker && event.speakerName !== filters.speaker) return false
  if (filters.availability === 'full' && !isFull(event)) return false
  if (
    filters.availability === 'open' &&
    (isFull(event) || event.status === 'abgesagt')
  )
    return false
  return true
}

/** Termine, deren Veranstaltung die Filter erfüllt (Monat gilt für den Termin). */
export function filterOccurrences(
  occurrences: Occurrence[],
  events: PublicEvent[],
  filters: EventFilters,
): Occurrence[] {
  const allowed = new Set(
    events.filter((event) => matchesFilters(event, filters)).map((e) => e.id),
  )
  return occurrences.filter(
    (o) =>
      allowed.has(o.eventId) &&
      (filters.month === '' || monthKey(o.startsAt) === filters.month),
  )
}

/** Erster kommender Termin einer Veranstaltung, sonst der letzte vorhandene. */
export function nextOccurrenceOf(
  eventId: string,
  occurrences: Occurrence[],
  now: number,
): Occurrence | null {
  const own = occurrences.filter((o) => o.eventId === eventId).sort(byStart)
  if (own.length === 0) return null
  return own.find((o) => isUpcomingOccurrence(o, now)) ?? own[own.length - 1]
}

/**
 * Die nächsten Veranstaltungen für die große Übersicht: erst hervorgehobene, dann die übrigen,
 * jeweils nach dem nächsten Termin. Jede Veranstaltung nur einmal, abgesagte nicht.
 */
export function nextEvents(
  events: PublicEvent[],
  occurrences: Occurrence[],
  now: number,
  count = 3,
): PublicEvent[] {
  const candidates = events
    .filter((e) => e.status !== 'abgesagt' && !isPastEvent(e, occurrences, now))
    .map((event) => ({
      event,
      next: nextOccurrenceOf(event.id, occurrences, now),
    }))
    .filter(
      (item): item is { event: PublicEvent; next: Occurrence } =>
        item.next !== null && isUpcomingOccurrence(item.next, now),
    )
    .sort((a, b) => a.next.startsAt.localeCompare(b.next.startsAt))
  const featured = candidates.filter((c) => c.event.isFeatured)
  const others = candidates.filter((c) => !c.event.isFeatured)
  return [...featured, ...others].slice(0, count).map((c) => c.event)
}

/** Monate (JJJJ-MM) mit kommenden Terminen, aufsteigend. */
export function monthOptions(occurrences: Occurrence[], now: number): string[] {
  return [
    ...new Set(
      upcomingOccurrences(occurrences, now).map((o) => monthKey(o.startsAt)),
    ),
  ].sort()
}

export function groupByMonth(
  occurrences: Occurrence[],
): [string, Occurrence[]][] {
  const groups = new Map<string, Occurrence[]>()
  for (const occurrence of occurrences) {
    const key = monthKey(occurrence.startsAt)
    groups.set(key, [...(groups.get(key) ?? []), occurrence])
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

/** Wochen eines Monats, Montag zuerst, Tage außerhalb des Monats sind null. */
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Termine je Tag (JJJJ-MM-TT). Mehrtägige Termine erscheinen an jedem Tag, höchstens 31. */
export function occurrencesByDay(
  occurrences: Occurrence[],
): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>()
  const add = (key: string, occurrence: Occurrence) =>
    map.set(key, [...(map.get(key) ?? []), occurrence])
  for (const occurrence of [...occurrences].sort(byStart)) {
    const start = new Date(occurrence.startsAt)
    const end = occurrence.endsAt ? new Date(occurrence.endsAt) : start
    const startDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    )
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    for (let i = 0; i <= 30; i += 1) {
      const day = new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate() + i,
      )
      if (day > endDay) break
      add(dayKey(day), occurrence)
    }
  }
  return map
}

/** Termine, die in den Monat (JJJJ-MM) fallen, auch mehrtägige, die dort beginnen oder enden oder ihn durchlaufen. */
export function occurrencesInMonth(
  occurrences: Occurrence[],
  month: string,
): Occurrence[] {
  const byDay = occurrencesByDay(occurrences)
  const found = new Set<Occurrence>()
  for (const [key, items] of byDay) {
    if (key.startsWith(month)) for (const item of items) found.add(item)
  }
  return occurrences.filter((o) => found.has(o)).sort(byStart)
}

/**
 * Anzuzeigender Status. „Geplant“ wird nicht gezeigt. Vergangene Veranstaltungen zeigen
 * „beendet“, außer sie wurden abgesagt.
 */
export function publicStatus(
  event: PublicEvent,
  past: boolean,
): PublicStatus | null {
  if (event.status === 'abgesagt' || event.status === 'verschoben')
    return event.status
  if (past || event.status === 'beendet' || event.status === 'archiviert')
    return 'beendet'
  if (event.status === 'geplant') return null
  if (event.placesAvailable === 0) return 'ausgebucht'
  return event.status
}

/** Bis zu welchem Zeitpunkt die Anmeldung möglich ist. */
export function registrationIsOpen(event: PublicEvent, now: number): boolean {
  if (!event.registrationOpen) return false
  if (
    event.status === 'abgesagt' ||
    event.status === 'beendet' ||
    event.status === 'archiviert'
  )
    return false
  if (
    event.registrationDeadline &&
    new Date(event.registrationDeadline).getTime() < now
  )
    return false
  return true
}

/** Absätze aus Text mit Leerzeilen. */
export function paragraphs(text: string | null): string[] {
  if (!text) return []
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Verschiedene, nicht leere Werte für Filterlisten, alphabetisch. */
export function distinct(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((v): v is string => !!v && v.trim() !== '')),
  ].sort((a, b) => a.localeCompare(b, 'de'))
}
