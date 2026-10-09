import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  handleCancellation,
  type CancelOutcome,
  type CancellationDeps,
} from './cancellation.ts'
import { signToken } from './token.ts'
import type { Mail } from './emails.ts'
import type { RateState } from './spam.ts'

const NOW = 1_800_000_000_000
const KEY = '22222222-2222-4222-8222-222222222222'
const event = {
  title: 'Atelierabend',
  startsAt: '2027-03-10T17:30:00.000Z',
  endsAt: null,
  location: 'Schloss',
  address: null,
  slug: 'atelierabend',
}

function setup(
  outcome: CancelOutcome,
  overrides: Partial<CancellationDeps> = {},
) {
  const mails: Mail[] = []
  const calls: string[] = []
  const rates = new Map<string, RateState>()
  const deps: CancellationDeps = {
    now: () => NOW,
    senderKey: 'abc',
    rates: {
      get: async (k) => rates.get(k) ?? null,
      set: async (k, v) => void rates.set(k, v),
    },
    data: {
      cancel: async (key) => (calls.push(key), outcome),
      findEvent: async () => event,
    },
    mail: { send: async (mail) => void mails.push(mail) },
    config: {
      notifyTo: 'stephan.bentzel@viqua.de',
      siteName: 'Stephan Graf Bentzel-Sturmfeder',
      siteUrl: 'https://bentzel-sturmfeder.de',
      tokenSecret: 'geheim',
    },
    ...overrides,
  }
  return { deps, mails, calls }
}

const cancelled = (
  extra: Partial<Extract<CancelOutcome, { outcome: 'cancelled' }>> = {},
): CancelOutcome => ({
  outcome: 'cancelled',
  eventId: 'e1',
  name: 'Anna',
  email: 'anna@example.com',
  status: 'angemeldet',
  promoted: [],
  ...extra,
})

test('Stornierung: Status, Mail an die Person und Mitteilung an den Künstler', async () => {
  const { deps, mails, calls } = setup(cancelled())
  const token = await signToken(KEY, 'geheim')
  const result = await handleCancellation({ token }, deps)
  assert.deepEqual(result, {
    status: 200,
    body: { ok: true, result: 'cancelled' },
  })
  assert.deepEqual(calls, [KEY])
  assert.equal(mails.length, 2)
  assert.equal(mails[0].to, 'anna@example.com')
  assert.equal(mails[0].subject, 'Abmeldung bestätigt: Atelierabend')
  assert.equal(mails[1].to, 'stephan.bentzel@viqua.de')
  assert.equal(mails[1].subject, 'Stornierung: Atelierabend')
})

test('Nachrücken: Wer nachrückt, erhält Bestätigung mit .ics und neuem Stornierungslink, der Künstler erfährt es', async () => {
  const { deps, mails } = setup(
    cancelled({
      promoted: [
        {
          id: 'p1',
          name: 'Bernd',
          email: 'bernd@example.com',
          guests: 1,
          cancelKey: '33333333-3333-4333-8333-333333333333',
        },
        {
          id: 'p2',
          name: 'Clara',
          email: 'clara@example.com',
          guests: 0,
          cancelKey: '44444444-4444-4444-8444-444444444444',
        },
      ],
    }),
  )
  await handleCancellation({ token: await signToken(KEY, 'geheim') }, deps)
  const promotions = mails.filter((m) =>
    m.subject.startsWith('Ein Platz ist frei'),
  )
  assert.deepEqual(
    promotions.map((m) => m.to),
    ['bernd@example.com', 'clara@example.com'],
  )
  assert.equal(promotions[0].attachments?.[0].filename, 'termin.ics')
  assert.equal(promotions[0].text.includes('2 Personen (mit Begleitung)'), true)
  assert.equal(
    promotions[0].text.includes(
      'https://bentzel-sturmfeder.de/abmelden?token=',
    ),
    true,
  )
  assert.notEqual(promotions[0].text, promotions[1].text)
  assert.equal(
    mails[1].text.includes('Nachgerückt: Bernd (2), Clara (1)'),
    true,
  )
})

test('Stornierung von der Warteliste hat einen eigenen Text', async () => {
  const { deps, mails } = setup(cancelled({ status: 'warteliste' }))
  await handleCancellation({ token: await signToken(KEY, 'geheim') }, deps)
  assert.equal(mails[0].text.includes('von der Warteliste genommen'), true)
  assert.equal(mails[1].subject, 'Warteliste storniert: Atelierabend')
})

test('Schon storniert oder unbekannt', async () => {
  const token = await signToken(KEY, 'geheim')
  const again = setup({ outcome: 'already_cancelled' })
  assert.deepEqual(await handleCancellation({ token }, again.deps), {
    status: 200,
    body: { ok: true, result: 'already_cancelled' },
  })
  assert.equal(again.mails.length, 0)
  const unknown = setup({ outcome: 'unknown' })
  assert.deepEqual(await handleCancellation({ token }, unknown.deps), {
    status: 404,
    body: { ok: false, error: 'unknown' },
  })
})

test('Ungültiges, gefälschtes oder fremd signiertes Token wird abgelehnt, ohne die Datenbank zu fragen', async () => {
  const { deps, calls } = setup(cancelled())
  const good = await signToken(KEY, 'geheim')
  for (const token of [
    good.replace(KEY, '55555555-5555-4555-8555-555555555555'),
    await signToken(KEY, 'falsch'),
    'ohne-punkt-aber-lang-genug',
  ]) {
    const result = await handleCancellation({ token }, deps)
    assert.equal(result.status, 400)
    assert.equal(result.body.error, 'invalid_token')
  }
  assert.equal((await handleCancellation({}, deps)).body.error, 'invalid')
  assert.equal(
    (await handleCancellation({ token: 'kurz' }, deps)).body.error,
    'invalid',
  )
  assert.equal(calls.length, 0)
})

test('Begrenzung je Absender und Versandfehler', async () => {
  const token = await signToken(KEY, 'geheim')
  const { deps } = setup({ outcome: 'unknown' })
  for (let i = 0; i < 5; i += 1)
    assert.equal((await handleCancellation({ token }, deps)).status, 404)
  assert.equal((await handleCancellation({ token }, deps)).status, 429)
  const failing = setup(cancelled(), {
    mail: {
      send: async () => {
        throw new Error('Resend 500')
      },
    },
  })
  assert.deepEqual((await handleCancellation({ token }, failing.deps)).body, {
    ok: true,
    result: 'cancelled',
  })
})
