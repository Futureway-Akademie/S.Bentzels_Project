import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  dayKey,
  distinct,
  emptyFilters,
  filterOccurrences,
  groupByMonth,
  hasFilters,
  isPastEvent,
  isUpcomingOccurrence,
  monthGrid,
  monthOptions,
  nextEvents,
  nextOccurrenceOf,
  occurrencesByDay,
  occurrencesInMonth,
  paragraphs,
  publicStatus,
  registrationIsOpen,
  upcomingOccurrences,
  type Occurrence,
  type PublicEvent,
} from './eventCalendar.ts'

const NOW = new Date(2027, 5, 10, 12, 0).getTime()
const at = (m: number, d: number, h = 18) =>
  new Date(2027, m - 1, d, h, 0).toISOString()

const event = (id: string, extra: Partial<PublicEvent> = {}): PublicEvent => ({
  id,
  slug: id,
  typeId: null,
  category: null,
  status: 'geplant',
  isFeatured: false,
  titleDe: `Titel ${id}`,
  shortDescriptionDe: null,
  descriptionDe: null,
  recapTextDe: null,
  startsAt: null,
  endsAt: null,
  showTime: true,
  isMultiDay: false,
  imageUrl: null,
  imageThumbUrl: null,
  imageWidth: null,
  imageHeight: null,
  registrationOpen: false,
  registrationDeadline: null,
  registrationMode: 'anfrage',
  audienceDe: null,
  requirementsDe: null,
  materialsDe: null,
  includedDe: null,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  pdfUrl: null,
  pdfLabelDe: null,
  externalUrl: null,
  locationName: null,
  locationAddress: null,
  speakerName: null,
  capacity: null,
  placesAvailable: null,
  priceEur: null,
  priceOnRequest: null,
  priceNoteDe: null,
  ...extra,
})

const occ = (
  eventId: string,
  startsAt: string,
  extra: Partial<Occurrence> = {},
): Occurrence => ({
  eventId,
  slug: eventId,
  titleDe: `Titel ${eventId}`,
  typeId: null,
  status: 'geplant',
  isFeatured: false,
  startsAt,
  endsAt: null,
  showTime: true,
  isCancelled: false,
  noteDe: null,
  isFirst: true,
  ...extra,
})

test('Kommende Termine: bis zum Ende, ohne Ende bis zum Tagesende', () => {
  assert.equal(isUpcomingOccurrence(occ('a', at(6, 10, 9)), NOW), true)
  assert.equal(isUpcomingOccurrence(occ('a', at(6, 9, 9)), NOW), false)
  assert.equal(
    isUpcomingOccurrence(
      occ('a', at(6, 10, 9), { endsAt: at(6, 10, 11) }),
      NOW,
    ),
    false,
  )
  assert.equal(
    isUpcomingOccurrence(
      occ('a', at(6, 10, 9), { endsAt: at(6, 10, 13) }),
      NOW,
    ),
    true,
  )
})

test('Kommende Termine sind chronologisch sortiert', () => {
  const list = upcomingOccurrences(
    [
      occ('c', at(9, 1)),
      occ('a', at(7, 1)),
      occ('old', at(1, 1)),
      occ('b', at(8, 1)),
    ],
    NOW,
  )
  assert.deepEqual(
    list.map((o) => o.eventId),
    ['a', 'b', 'c'],
  )
})

test('Vergangen: Status oder letzter Termin mehr als einen Tag her', () => {
  const e = event('a', { startsAt: at(5, 1) })
  assert.equal(isPastEvent(e, [occ('a', at(5, 1))], NOW), true)
  assert.equal(
    isPastEvent(
      e,
      [occ('a', at(5, 1)), occ('a', at(8, 1), { isFirst: false })],
      NOW,
    ),
    false,
  )
  assert.equal(isPastEvent(event('b'), [], NOW), false)
  assert.equal(
    isPastEvent(event('c', { status: 'beendet', startsAt: at(9, 1) }), [], NOW),
    true,
  )
  assert.equal(
    isPastEvent(event('d', { startsAt: at(6, 9, 20) }), [], NOW),
    false,
  )
})

test('Filter: Art, Ort, Referent, Verfügbarkeit, Monat', () => {
  const events = [
    event('a', {
      typeId: 't1',
      locationName: 'Atelier',
      speakerName: 'Bentzel',
      placesAvailable: 3,
    }),
    event('b', { typeId: 't2', locationName: 'Schloss', status: 'ausgebucht' }),
    event('c', { typeId: 't1', locationName: 'Atelier', status: 'abgesagt' }),
  ]
  const occs = [
    occ('a', at(7, 5)),
    occ('b', at(7, 6)),
    occ('c', at(8, 7)),
    occ('a', at(8, 9), { isFirst: false }),
  ]
  const ids = (f: Partial<typeof emptyFilters>) =>
    filterOccurrences(occs, events, { ...emptyFilters, ...f }).map(
      (o) => o.eventId + (o.isFirst ? '' : '+'),
    )
  assert.deepEqual(ids({}), ['a', 'b', 'c', 'a+'])
  assert.deepEqual(ids({ typeId: 't1' }), ['a', 'c', 'a+'])
  assert.deepEqual(ids({ place: 'Schloss' }), ['b'])
  assert.deepEqual(ids({ speaker: 'Bentzel' }), ['a', 'a+'])
  assert.deepEqual(ids({ availability: 'open' }), ['a', 'a+'])
  assert.deepEqual(ids({ availability: 'full' }), ['b'])
  assert.deepEqual(ids({ month: '2027-08' }), ['c', 'a+'])
  assert.equal(hasFilters(emptyFilters), false)
  assert.equal(hasFilters({ ...emptyFilters, place: 'x' }), true)
})

test('Nächste Veranstaltungen: Hervorgehobene zuerst, abgesagte und vergangene nicht', () => {
  const events = [
    event('a', { startsAt: at(7, 1) }),
    event('b', { startsAt: at(8, 1), isFeatured: true }),
    event('c', { startsAt: at(9, 1), isFeatured: true }),
    event('d', { startsAt: at(7, 2), status: 'abgesagt' }),
    event('e', { startsAt: at(1, 1) }),
    event('f', { startsAt: at(10, 1) }),
  ]
  const occs = events
    .filter((e) => e.startsAt)
    .map((e) => occ(e.id, e.startsAt!))
  assert.deepEqual(
    nextEvents(events, occs, NOW, 3).map((e) => e.id),
    ['b', 'c', 'a'],
  )
  assert.deepEqual(
    nextEvents(events, occs, NOW, 10).map((e) => e.id),
    ['b', 'c', 'a', 'f'],
  )
  assert.deepEqual(nextEvents([event('x')], [], NOW), [])
})

test('Nächster Termin einer Veranstaltung', () => {
  const occs = [occ('a', at(5, 1)), occ('a', at(7, 1)), occ('a', at(8, 1))]
  assert.equal(nextOccurrenceOf('a', occs, NOW)?.startsAt, at(7, 1))
  assert.equal(
    nextOccurrenceOf('a', [occ('a', at(1, 1)), occ('a', at(2, 1))], NOW)
      ?.startsAt,
    at(2, 1),
  )
  assert.equal(nextOccurrenceOf('z', occs, NOW), null)
})

test('Monate mit kommenden Terminen und Gruppierung', () => {
  const occs = [
    occ('a', at(8, 1)),
    occ('b', at(7, 20)),
    occ('c', at(8, 15)),
    occ('d', at(2, 1)),
  ]
  assert.deepEqual(monthOptions(occs, NOW), ['2027-07', '2027-08'])
  const groups = groupByMonth(upcomingOccurrences(occs, NOW))
  assert.deepEqual(
    groups.map(([key, items]) => [key, items.length]),
    [
      ['2027-07', 1],
      ['2027-08', 2],
    ],
  )
})

test('Monatsraster beginnt am Montag und füllt die Woche auf', () => {
  const weeks = monthGrid(2027, 2) // März 2027 beginnt an einem Montag
  assert.equal(weeks[0][0] && dayKey(weeks[0][0]), '2027-03-01')
  assert.equal(
    weeks.every((w) => w.length === 7),
    true,
  )
  assert.equal(weeks.flat().filter(Boolean).length, 31)
  const june = monthGrid(2027, 5) // Juni 2027 beginnt an einem Dienstag
  assert.equal(june[0][0], null)
  assert.equal(june[0][1] && dayKey(june[0][1]), '2027-06-01')
})

test('Termine je Tag, mehrtägige an jedem Tag', () => {
  const map = occurrencesByDay([
    occ('a', at(7, 1)),
    occ('b', new Date(2027, 6, 3, 10).toISOString(), {
      endsAt: new Date(2027, 6, 5, 16).toISOString(),
    }),
  ])
  assert.equal(map.get('2027-07-01')?.length, 1)
  assert.deepEqual(
    ['2027-07-03', '2027-07-04', '2027-07-05'].map((k) => map.get(k)?.length),
    [1, 1, 1],
  )
  assert.equal(map.get('2027-07-06'), undefined)
})

test('Angezeigter Status', () => {
  assert.equal(publicStatus(event('a'), false), null)
  assert.equal(
    publicStatus(event('a', { status: 'anmeldung_moeglich' }), false),
    'anmeldung_moeglich',
  )
  assert.equal(
    publicStatus(event('a', { status: 'wenige_plaetze' }), false),
    'wenige_plaetze',
  )
  assert.equal(
    publicStatus(
      event('a', { status: 'anmeldung_moeglich', placesAvailable: 0 }),
      false,
    ),
    'ausgebucht',
  )
  assert.equal(
    publicStatus(event('a', { status: 'abgesagt' }), true),
    'abgesagt',
  )
  assert.equal(
    publicStatus(event('a', { status: 'verschoben' }), false),
    'verschoben',
  )
  assert.equal(publicStatus(event('a'), true), 'beendet')
  assert.equal(
    publicStatus(event('a', { status: 'archiviert' }), false),
    'beendet',
  )
})

test('Anmeldung nur offen, wenn freigegeben, nicht abgesagt und vor der Frist', () => {
  assert.equal(registrationIsOpen(event('a'), NOW), false)
  assert.equal(
    registrationIsOpen(event('a', { registrationOpen: true }), NOW),
    true,
  )
  assert.equal(
    registrationIsOpen(
      event('a', { registrationOpen: true, status: 'abgesagt' }),
      NOW,
    ),
    false,
  )
  assert.equal(
    registrationIsOpen(
      event('a', { registrationOpen: true, registrationDeadline: at(6, 1) }),
      NOW,
    ),
    false,
  )
  assert.equal(
    registrationIsOpen(
      event('a', { registrationOpen: true, registrationDeadline: at(7, 1) }),
      NOW,
    ),
    true,
  )
})

test('Absätze und Filterlisten', () => {
  assert.deepEqual(paragraphs('Eins.\n\nZwei.\n  \n\nDrei.'), [
    'Eins.',
    'Zwei.',
    'Drei.',
  ])
  assert.deepEqual(paragraphs(null), [])
  assert.deepEqual(paragraphs('   '), [])
  assert.deepEqual(distinct(['Wien', null, 'Berlin', 'Wien', '', ' ']), [
    'Berlin',
    'Wien',
  ])
})

test('Termine eines Monats, auch mehrtägige über den Monatswechsel', () => {
  const occs = [
    occ('a', at(7, 5)),
    occ('b', new Date(2027, 5, 29, 10).toISOString(), {
      endsAt: new Date(2027, 6, 2, 16).toISOString(),
    }),
    occ('c', at(8, 1)),
  ]
  assert.deepEqual(
    occurrencesInMonth(occs, '2027-07').map((o) => o.eventId),
    ['b', 'a'],
  )
  assert.deepEqual(
    occurrencesInMonth(occs, '2027-06').map((o) => o.eventId),
    ['b'],
  )
  assert.deepEqual(occurrencesInMonth(occs, '2027-09'), [])
})
