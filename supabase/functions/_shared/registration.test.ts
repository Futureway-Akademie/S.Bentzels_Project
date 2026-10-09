import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildIcs } from './ics.ts'
import {
  handleRegistration,
  type RegistrationDeps,
  type RegisterResult,
} from './registration.ts'
import { signToken, verifyToken } from './token.ts'
import type { Mail } from './emails.ts'
import type { RateState } from './spam.ts'

const NOW = 1_800_000_000_000
const uuid = '11111111-1111-4111-8111-111111111111'
const event = {
  title: 'Atelierabend',
  startsAt: '2027-03-10T17:30:00.000Z',
  endsAt: '2027-03-10T20:30:00.000Z',
  location: 'Schloss Jägersburg',
  address: 'Fürstenweg 1, 91330 Bammersdorf',
  slug: 'atelierabend',
}

function setup(
  result: Partial<RegisterResult> | Error = {},
  overrides: Partial<RegistrationDeps> = {},
) {
  const mails: Mail[] = []
  const calls: unknown[] = []
  const rates = new Map<string, RateState>()
  const deps: RegistrationDeps = {
    now: () => NOW,
    senderKey: 'abc',
    rates: {
      get: async (k) => rates.get(k) ?? null,
      set: async (k, v) => void rates.set(k, v),
    },
    data: {
      register: async (input) => {
        calls.push(input)
        if (result instanceof Error) throw result
        return {
          registrationId: 'r1',
          cancelKey: '22222222-2222-4222-8222-222222222222',
          status: 'angemeldet',
          seatsLeft: 7,
          ...result,
        }
      },
      findEvent: async () => event,
    },
    mail: { send: async (mail) => void mails.push(mail) },
    config: {
      notifyTo: 'stephan.bentzel@viqua.de',
      siteName: 'Stephan Graf Bentzel-Sturmfeder',
      siteUrl: 'https://www.sturmfederprojects.de/',
      tokenSecret: 'geheim',
    },
    ...overrides,
  }
  return { deps, mails, calls }
}

const input = (extra: Record<string, unknown> = {}) => ({
  type: 'anmeldung',
  eventId: uuid,
  name: 'Erika Muster',
  email: 'erika@example.com',
  guests: '2',
  consent: true,
  startedAt: NOW - 60_000,
  ...extra,
})

test('Anmeldung: Datenbankfunktion mit Begleitung, Bestätigung mit .ics und Stornierungslink, Mitteilung an den Künstler', async () => {
  const { deps, mails, calls } = setup()
  const result = await handleRegistration(input(), deps)
  assert.deepEqual(result, {
    status: 200,
    body: { ok: true, registration: 'angemeldet' },
  })
  assert.deepEqual(calls[0], {
    eventId: uuid,
    name: 'Erika Muster',
    email: 'erika@example.com',
    phone: null,
    company: null,
    guests: 2,
  })
  assert.equal(mails.length, 2)
  const guest = mails[0]
  assert.equal(guest.to, 'erika@example.com')
  assert.equal(guest.subject, 'Ihre Anmeldung: Atelierabend')
  assert.equal(guest.text.includes('3 Personen (mit Begleitung)'), true)
  assert.equal(
    guest.text.includes('https://www.sturmfederprojects.de/abmelden?token='),
    true,
  )
  assert.equal(guest.attachments?.[0].filename, 'termin.ics')
  assert.equal(
    guest.attachments?.[0].content.includes('SUMMARY:Atelierabend'),
    true,
  )
  assert.equal(mails[1].to, 'stephan.bentzel@viqua.de')
  assert.equal(mails[1].subject, 'Neue Anmeldung: Atelierabend')
  assert.equal(mails[1].text.includes('Noch frei: 7'), true)
})

test('Warteliste: eigener Text, keine Kalenderdatei', async () => {
  const { deps, mails } = setup({ status: 'warteliste', seatsLeft: 0 })
  const result = await handleRegistration(input({ guests: 0 }), deps)
  assert.deepEqual(result.body, { ok: true, registration: 'warteliste' })
  assert.equal(mails[0].subject, 'Warteliste: Atelierabend')
  assert.equal(mails[0].text.includes('Warteliste'), true)
  assert.equal(mails[0].attachments, undefined)
  assert.equal(mails[1].subject, 'Neue Warteliste: Atelierabend')
})

test('Der Stornierungslink enthält ein prüfbares Token', async () => {
  const { deps, mails } = setup()
  await handleRegistration(input(), deps)
  const url = mails[0].text.match(/token=([^\s]+)/)![1]
  const key = await verifyToken(decodeURIComponent(url), 'geheim')
  assert.equal(key, '22222222-2222-4222-8222-222222222222')
  assert.equal(await verifyToken(decodeURIComponent(url), 'falsch'), null)
})

test('Fehler der Datenbankfunktion: geschlossen, doppelt, unbekannt, sonst Fehler weitergeben', async () => {
  for (const [code, status] of [
    ['closed', 400],
    ['duplicate', 409],
    ['unknown_event', 400],
  ] as const) {
    const { deps, mails } = setup(new Error(`${code}`))
    const result = await handleRegistration(input(), deps)
    assert.equal(result.status, status)
    assert.equal(result.body.error, code)
    assert.equal(mails.length, 0)
  }
  const { deps } = setup(new Error('Verbindung getrennt'))
  await assert.rejects(handleRegistration(input(), deps), /Verbindung/)
})

test('Ungültige Eingaben, Begleitung über 3, ohne Zustimmung', async () => {
  const { deps, calls } = setup()
  const bad = await handleRegistration(
    input({ guests: 4, consent: false, email: 'x' }),
    deps,
  )
  assert.equal(bad.status, 400)
  assert.equal(bad.body.errors?.guests, 'number')
  assert.equal(bad.body.errors?.consent, 'consent')
  assert.equal(bad.body.errors?.email, 'email')
  assert.equal(calls.length, 0)
})

test('Spam und Begrenzung', async () => {
  const { deps, calls } = setup()
  assert.equal(
    (await handleRegistration(input({ website: 'spam' }), deps)).status,
    200,
  )
  assert.equal(
    (await handleRegistration(input({ startedAt: NOW - 500 }), deps)).status,
    200,
  )
  assert.equal(calls.length, 0)
  for (let i = 0; i < 5; i += 1)
    assert.equal(
      (await handleRegistration(input({ email: `g${i}@example.com` }), deps))
        .status,
      200,
    )
  assert.equal(
    (await handleRegistration(input({ email: 'sechste@example.com' }), deps))
      .status,
    429,
  )
})

test('Fällt der E-Mail-Versand aus, bleibt die Anmeldung gültig', async () => {
  const { deps } = setup(
    {},
    {
      mail: {
        send: async () => {
          throw new Error('Resend 500')
        },
      },
    },
  )
  const result = await handleRegistration(input(), deps)
  assert.deepEqual(result.body, { ok: true, registration: 'angemeldet' })
})

test('Kalenderdatei: Pflichtzeilen, UTC-Zeiten, Maskierung, Standarddauer, ohne Beginn nichts', () => {
  const ics = buildIcs({
    uid: 'u1',
    title: 'Vortrag; Teil 1, "Kunst"',
    startsAt: '2027-03-10T17:30:00.000Z',
    location: 'Ort, Straße 1',
    now: new Date('2027-01-01T00:00:00Z'),
  })!
  assert.equal(ics.startsWith('BEGIN:VCALENDAR\r\n'), true)
  assert.equal(ics.endsWith('END:VCALENDAR\r\n'), true)
  assert.equal(ics.includes('DTSTART:20270310T173000Z'), true)
  assert.equal(ics.includes('DTEND:20270310T193000Z'), true)
  assert.equal(ics.includes('DTSTAMP:20270101T000000Z'), true)
  assert.equal(
    ics.includes(String.raw`SUMMARY:Vortrag\; Teil 1\, "Kunst"`),
    true,
  )
  assert.equal(ics.includes(String.raw`LOCATION:Ort\, Straße 1`), true)
  assert.equal(buildIcs({ uid: 'u', title: 'X', startsAt: null }), null)
  assert.equal(buildIcs({ uid: 'u', title: 'X', startsAt: 'kein Datum' }), null)
  const long = buildIcs({
    uid: 'u',
    title: 'x'.repeat(200),
    startsAt: '2027-03-10T17:30:00.000Z',
  })!
  assert.equal(
    long.split('\r\n').every((line) => line.length <= 75),
    true,
  )
})

test('Token: Roundtrip, Manipulation und Fremdschlüssel', async () => {
  const token = await signToken('abc-123', 'schluessel')
  assert.equal(await verifyToken(token, 'schluessel'), 'abc-123')
  assert.equal(await verifyToken(token, 'anderer'), null)
  assert.equal(
    await verifyToken(token.replace('abc', 'xyz'), 'schluessel'),
    null,
  )
  assert.equal(await verifyToken('ohne-punkt', 'schluessel'), null)
  assert.equal(await verifyToken('.nur-signatur', 'schluessel'), null)
})
