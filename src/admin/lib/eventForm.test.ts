import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  eventFormFromRow,
  generateRecurrence,
  lastMoment,
  scopeOf,
  shiftToDay,
  toDatePayloads,
  toEventPayload,
  validateEventForm,
  type EventFormValues,
} from './eventForm.ts'

const empty: EventFormValues = eventFormFromRow({})
const withTitle = (extra: Partial<EventFormValues> = {}): EventFormValues => ({
  ...empty,
  title_de: 'Aktzeichnen',
  ...extra,
})

test('Nur der Titel ist Pflicht', () => {
  assert.deepEqual(validateEventForm(withTitle()), {})
  assert.equal(validateEventForm(empty).title_de, 'required')
  assert.equal(
    validateEventForm(withTitle({ title_de: '   ' })).title_de,
    'required',
  )
})

test('Leere Angaben werden zu NULL, Standardwerte stimmen', () => {
  const payload = toEventPayload(withTitle())
  assert.equal(payload.title_de, 'Aktzeichnen')
  assert.equal(payload.status, 'geplant')
  assert.equal(payload.is_published, false)
  assert.equal(payload.archive_visible, true)
  for (const key of [
    'type_id',
    'category',
    'description_de',
    'starts_at',
    'ends_at',
    'capacity',
    'places_available',
    'price_eur',
    'contact_email',
    'external_url',
    'internal_note',
  ] as const) {
    assert.equal(payload[key], null, key)
  }
})

test('Zahlen und Preise werden geprüft und umgewandelt', () => {
  const ok = toEventPayload(
    withTitle({ capacity: '12', places_available: '5', price_eur: '89,50' }),
  )
  assert.equal(ok.capacity, 12)
  assert.equal(ok.places_available, 5)
  assert.equal(ok.price_eur, 89.5)
  assert.equal(
    validateEventForm(withTitle({ capacity: 'zwölf' })).capacity,
    'numberInvalid',
  )
  assert.equal(
    validateEventForm(withTitle({ capacity: '-3' })).capacity,
    'numberInvalid',
  )
  assert.equal(
    validateEventForm(withTitle({ price_eur: '12,345' })).price_eur,
    'priceInvalid',
  )
  assert.equal(
    validateEventForm(withTitle({ price_eur: '0' })).price_eur,
    undefined,
  )
})

test('Freie Plätze dürfen die Teilnehmerzahl nicht übersteigen', () => {
  assert.equal(
    validateEventForm(withTitle({ capacity: '10', places_available: '11' }))
      .places_available,
    'placesExceed',
  )
  assert.deepEqual(
    validateEventForm(withTitle({ capacity: '10', places_available: '10' })),
    {},
  )
  assert.deepEqual(validateEventForm(withTitle({ places_available: '3' })), {})
})

test('Termine: Ende nicht vor dem Beginn, ungültige Eingaben', () => {
  assert.equal(
    validateEventForm(
      withTitle({ starts_at: '2027-03-10T18:00', ends_at: '2027-03-10T17:00' }),
    ).ends_at,
    'endBeforeStart',
  )
  assert.deepEqual(
    validateEventForm(
      withTitle({ starts_at: '2027-03-10T18:00', ends_at: '2027-03-10T20:00' }),
    ),
    {},
  )
  assert.equal(
    validateEventForm(withTitle({ starts_at: 'gestern' })).starts_at,
    'dateInvalid',
  )
  assert.equal(
    validateEventForm(withTitle({ registration_deadline: 'bald' }))
      .registration_deadline,
    'dateInvalid',
  )
})

test('Weitere Termine werden einzeln geprüft', () => {
  const dates = [
    {
      id: null,
      key: 'a',
      starts_at: '2027-03-17T18:00',
      ends_at: '',
      note_de: '',
      is_cancelled: false,
    },
    {
      id: null,
      key: 'b',
      starts_at: '',
      ends_at: '',
      note_de: '',
      is_cancelled: false,
    },
    {
      id: 'x',
      key: 'c',
      starts_at: '2027-03-24T18:00',
      ends_at: '2027-03-24T17:00',
      note_de: '',
      is_cancelled: false,
    },
  ]
  const errors = validateEventForm(withTitle({ dates }))
  assert.equal(errors['date:a'], undefined)
  assert.equal(errors['date:b'], 'dateInvalid')
  assert.equal(errors['date:c'], 'endBeforeStart')
  const payloads = toDatePayloads(withTitle({ dates: [dates[0]] }))
  assert.equal(payloads[0].ends_at, null)
  assert.equal(payloads[0].note_de, null)
  assert.equal(typeof payloads[0].starts_at, 'string')
})

test('E-Mail und Link werden geprüft', () => {
  assert.equal(
    validateEventForm(withTitle({ contact_email: 'kein-at' })).contact_email,
    'emailInvalid',
  )
  assert.deepEqual(
    validateEventForm(withTitle({ contact_email: 'a@b.de' })),
    {},
  )
  assert.equal(
    validateEventForm(withTitle({ external_url: 'javascript:alert(1)' }))
      .external_url,
    'urlInvalid',
  )
  assert.equal(
    validateEventForm(withTitle({ external_url: 'example.com' })).external_url,
    'urlInvalid',
  )
  assert.deepEqual(
    validateEventForm(withTitle({ external_url: 'https://example.com/x' })),
    {},
  )
})

test('Zu lange Texte werden abgelehnt', () => {
  assert.equal(
    validateEventForm(withTitle({ title_de: 'x'.repeat(201) })).title_de,
    'tooLong',
  )
  assert.equal(
    validateEventForm(withTitle({ short_description_de: 'x'.repeat(501) }))
      .short_description_de,
    'tooLong',
  )
})

test('Art der Anmeldung: Standard Anfrage, verbindlich wird übernommen', () => {
  assert.equal(toEventPayload(withTitle()).registration_mode, 'anfrage')
  assert.equal(
    toEventPayload(withTitle({ registration_mode: 'verbindlich' }))
      .registration_mode,
    'verbindlich',
  )
  assert.equal(
    eventFormFromRow({ registration_mode: 'verbindlich' }).registration_mode,
    'verbindlich',
  )
})

test('Formular aus Zeile: Zahlen und Preis zurück in Text, Termine übernommen', () => {
  const form = eventFormFromRow(
    {
      title_de: 'Kurs',
      capacity: 8,
      price_eur: 89.5,
      starts_at: '2027-03-10T17:00:00.000Z',
    },
    [
      {
        id: 'd1',
        starts_at: '2027-03-17T17:00:00.000Z',
        ends_at: null,
        note_de: 'Teil 2',
        is_cancelled: true,
      },
    ],
  )
  assert.equal(form.capacity, '8')
  assert.equal(form.price_eur, '89,5')
  assert.match(form.starts_at, /^2027-03-10T\d\d:00$/)
  assert.equal(form.dates.length, 1)
  assert.equal(form.dates[0].id, 'd1')
  assert.equal(form.dates[0].is_cancelled, true)
})

test('Wiederkehrende Termine: wöchentlich, alle zwei Wochen, monatlich mit Dauer', () => {
  const weekly = generateRecurrence(
    '2027-03-10T18:00',
    '2027-03-10T20:30',
    'weekly',
    3,
  )
  assert.deepEqual(weekly, [
    { starts_at: '2027-03-17T18:00', ends_at: '2027-03-17T20:30' },
    { starts_at: '2027-03-24T18:00', ends_at: '2027-03-24T20:30' },
    { starts_at: '2027-03-31T18:00', ends_at: '2027-03-31T20:30' },
  ])
  const biweekly = generateRecurrence('2027-03-10T18:00', '', 'biweekly', 2)
  assert.deepEqual(biweekly, [
    { starts_at: '2027-03-24T18:00', ends_at: '' },
    { starts_at: '2027-04-07T18:00', ends_at: '' },
  ])
  const monthly = generateRecurrence('2027-01-31T10:00', '', 'monthly', 2)
  assert.deepEqual(
    monthly.map((item) => item.starts_at),
    ['2027-02-28T10:00', '2027-03-31T10:00'],
  )
})

test('Wiederholung ohne gültigen Beginn oder mit falscher Anzahl erzeugt nichts', () => {
  assert.deepEqual(generateRecurrence('', '', 'weekly', 3), [])
  assert.deepEqual(generateRecurrence('2027-03-10T18:00', '', 'weekly', 0), [])
  assert.deepEqual(
    generateRecurrence('2027-03-10T18:00', '', 'weekly', 1.5),
    [],
  )
  assert.equal(
    generateRecurrence('2027-03-10T18:00', '', 'weekly', 500).length,
    60,
  )
})

test('Verschieben behält Uhrzeit und Dauer', () => {
  assert.deepEqual(
    shiftToDay('2027-03-10T18:00', '2027-03-10T20:30', '2027-04-02'),
    {
      starts_at: '2027-04-02T18:00',
      ends_at: '2027-04-02T20:30',
    },
  )
  assert.deepEqual(shiftToDay('2027-03-10T18:00', '', '2027-04-02'), {
    starts_at: '2027-04-02T18:00',
    ends_at: '',
  })
  assert.deepEqual(shiftToDay('', '', '2027-04-02'), {
    starts_at: '2027-04-02T00:00',
    ends_at: '',
  })
  assert.equal(shiftToDay('2027-03-10T18:00', '', 'morgen'), null)
})

test('Zuordnung zu Kommende, Vergangene und Archiv', () => {
  const now = new Date('2027-06-01T12:00:00Z').getTime()
  const base = { starts_at: null, ends_at: null, status: 'geplant' as const }
  assert.equal(scopeOf(base, [], now), 'upcoming')
  assert.equal(
    scopeOf({ ...base, starts_at: '2027-07-01T10:00:00Z' }, [], now),
    'upcoming',
  )
  assert.equal(
    scopeOf({ ...base, starts_at: '2027-05-01T10:00:00Z' }, [], now),
    'past',
  )
  assert.equal(
    scopeOf(
      { ...base, starts_at: '2027-05-01T10:00:00Z' },
      [{ starts_at: '2027-08-01T10:00:00Z', ends_at: null }],
      now,
    ),
    'upcoming',
  )
  assert.equal(
    scopeOf(
      { ...base, status: 'beendet', starts_at: '2027-07-01T10:00:00Z' },
      [],
      now,
    ),
    'past',
  )
  assert.equal(scopeOf({ ...base, status: 'archiviert' }, [], now), 'archive')
  assert.equal(lastMoment(base, []), null)
})
