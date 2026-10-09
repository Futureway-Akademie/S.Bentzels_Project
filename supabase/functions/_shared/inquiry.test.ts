import assert from 'node:assert/strict'
import { test } from 'node:test'
import { escapeHtml } from './emails.ts'
import { handleInquiry, type Deps, type InquiryRow } from './inquiry.ts'
import type { Mail } from './emails.ts'
import type { RateState } from './spam.ts'

const NOW = 1_800_000_000_000
const uuid = '11111111-1111-4111-8111-111111111111'

function setup(overrides: Partial<Deps> = {}) {
  const rows: InquiryRow[] = []
  const mails: Mail[] = []
  const rates = new Map<string, RateState>()
  const logs: string[] = []
  const deps: Deps = {
    now: () => NOW,
    senderKey: 'abc',
    rates: {
      get: async (key) => rates.get(key) ?? null,
      set: async (key, state) => void rates.set(key, state),
    },
    data: {
      insertInquiry: async (row) => void rows.push(row),
      findArtwork: async (id) =>
        id === uuid
          ? {
              title: 'Gössweinstein',
              imageUrl: 'https://example.com/w.webp',
              dimensions: '100 × 240 cm',
              priceEur: 6230,
            }
          : null,
      findEvent: async (id) =>
        id === uuid
          ? {
              title: 'Atelierabend',
              dateLine: '14. November 2026 um 18:30',
              location: 'Schloss',
            }
          : null,
    },
    mail: { send: async (mail) => void mails.push(mail) },
    config: {
      notifyTo: 'stephan.bentzel@viqua.de',
      siteName: 'Stephan Graf Bentzel-Sturmfeder',
      circleName: 'Bentzel Club',
    },
    log: (message) => void logs.push(message),
    ...overrides,
  }
  return { deps, rows, mails, rates, logs }
}

const input = (extra: Record<string, unknown>) => ({
  name: 'Erika Muster',
  email: 'erika@example.com',
  consent: true,
  startedAt: NOW - 60_000,
  ...extra,
})

test('Kontakt: wird gespeichert, Künstler und Absender erhalten je eine E-Mail', async () => {
  const { deps, rows, mails } = setup()
  const result = await handleInquiry(
    input({ type: 'kontakt', subject: 'Frage', message: 'Hallo <b>Welt</b>' }),
    deps,
  )
  assert.deepEqual(result, { status: 200, body: { ok: true } })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].type, 'kontakt')
  assert.equal(rows[0].message, 'Hallo <b>Welt</b>')
  assert.equal(rows[0].consent_at, new Date(NOW).toISOString())
  assert.equal(mails.length, 2)
  assert.equal(mails[0].to, 'stephan.bentzel@viqua.de')
  assert.equal(mails[0].subject, 'Kontakt: Frage')
  assert.equal(mails[0].replyTo, 'erika@example.com')
  assert.equal(mails[1].to, 'erika@example.com')
})

test('E-Mails maskieren Eingaben und lassen leere Angaben weg', async () => {
  const { deps, mails } = setup()
  await handleInquiry(
    input({
      type: 'kontakt',
      message: '<script>alert(1)</script>',
      name: 'A <b>B</b>',
    }),
    deps,
  )
  assert.equal(mails[0].html.includes('<script>'), false)
  assert.equal(mails[0].html.includes('&lt;script&gt;'), true)
  assert.equal(mails[0].html.includes('Telefon'), false)
  assert.equal(
    escapeHtml(`"a" & 'b' <c>`),
    '&quot;a&quot; &amp; &#39;b&#39; &lt;c&gt;',
  )
})

test('Werk: Betreff „Anfrage zu: Titel“, Bestätigung mit Bild, Titel, Maßen und Preis', async () => {
  const { deps, rows, mails } = setup()
  const result = await handleInquiry(
    input({ type: 'werk', artworkId: uuid, phone: '0171 1234' }),
    deps,
  )
  assert.equal(result.status, 200)
  assert.equal(rows[0].artwork_id, uuid)
  assert.equal(mails[0].subject, 'Anfrage zu: Gössweinstein')
  assert.equal(mails[1].html.includes('https://example.com/w.webp'), true)
  assert.equal(mails[1].html.includes('100 × 240 cm'), true)
  assert.equal(mails[1].html.includes('6.230 € inkl. MwSt.'), true)
  assert.equal(mails[1].text.includes('Gössweinstein'), true)
})

test('Werk ohne Preis in der öffentlichen Sicht: kein Preis in der E-Mail', async () => {
  const { deps, mails } = setup({
    data: {
      insertInquiry: async () => undefined,
      findArtwork: async () => ({
        title: null,
        imageUrl: null,
        dimensions: null,
        priceEur: null,
      }),
      findEvent: async () => null,
    },
  })
  await handleInquiry(input({ type: 'werk', artworkId: uuid }), deps)
  assert.equal(mails[0].subject, 'Anfrage zu: Werk ohne Titel')
  assert.equal(mails[1].html.includes('€'), false)
  assert.equal(mails[1].html.includes('<img'), false)
})

test('Unbekanntes Werk oder unbekannte Veranstaltung wird abgelehnt', async () => {
  const { deps, rows } = setup()
  const other = '22222222-2222-4222-8222-222222222222'
  assert.deepEqual(
    (await handleInquiry(input({ type: 'werk', artworkId: other }), deps)).body
      .error,
    'unknown_artwork',
  )
  assert.deepEqual(
    (
      await handleInquiry(
        input({ type: 'veranstaltung', eventId: other }),
        deps,
      )
    ).body.error,
    'unknown_event',
  )
  assert.equal(rows.length, 0)
})

test('Veranstaltung: Zuordnung, Personen und Art der Anfrage', async () => {
  const { deps, rows, mails } = setup()
  await handleInquiry(
    input({
      type: 'veranstaltung',
      eventId: uuid,
      persons: '2',
      interest: true,
    }),
    deps,
  )
  assert.equal(rows[0].event_id, uuid)
  assert.equal(rows[0].persons, 2)
  assert.equal(mails[0].subject, 'Anfrage zu: Atelierabend')
  assert.equal(mails[0].text.includes('Interesse angemeldet'), true)
})

test('Weitere Anfragearten: Betreff, Unternehmen und Zusatzangaben in payload', async () => {
  const { deps, rows, mails } = setup()
  await handleInquiry(
    input({
      type: 'seminar',
      company: 'Beispiel GmbH',
      participants: 'm',
      location: 'offen',
    }),
    deps,
  )
  assert.equal(mails[0].subject, 'Anfrage The Art of Becoming: Beispiel GmbH')
  assert.equal(rows[0].company, 'Beispiel GmbH')
  assert.deepEqual(rows[0].payload, { participants: 'm', location: 'offen' })
  assert.equal(mails[0].text.includes('Teilnehmende: 9–15'), true)
  await handleInquiry(
    input({
      type: 'vortrag',
      organization: 'Verein',
      topic: 'Kunst & Leadership',
    }),
    deps,
  )
  assert.equal(mails[2].subject, 'Vortragsanfrage: Verein')
  await handleInquiry(
    input({
      type: 'kunstkurs',
      course: 'individuell',
      persons: 3,
      experience: 'viel',
    }),
    deps,
  )
  assert.equal(mails[4].subject, 'Anfrage Kunstkurs')
  assert.equal(rows[2].persons, 3)
  await handleInquiry(input({ type: 'bentzel_club', meaning: 'Vieles' }), deps)
  assert.equal(mails[6].subject, 'Interesse am Bentzel Club')
})

test('Ungültige Eingaben: 400 mit Fehlern je Feld, nichts wird gespeichert', async () => {
  const { deps, rows, mails } = setup()
  const result = await handleInquiry(
    {
      type: 'kontakt',
      name: '',
      email: 'x',
      consent: false,
      startedAt: NOW - 60_000,
    },
    deps,
  )
  assert.equal(result.status, 400)
  assert.equal(result.body.errors?.name, 'required')
  assert.equal(result.body.errors?.email, 'email')
  assert.equal(result.body.errors?.consent, 'consent')
  assert.equal(rows.length + mails.length, 0)
})

test('Spam wird stillschweigend verworfen: Erfolg ohne Speichern und ohne E-Mail', async () => {
  const { deps, rows, mails } = setup()
  for (const extra of [
    { website: 'http://spam.example' },
    { startedAt: NOW - 500 },
    { startedAt: NOW + 60_000 },
  ]) {
    const result = await handleInquiry(
      input({ type: 'kontakt', message: 'x', ...extra }),
      deps,
    )
    assert.deepEqual(result, { status: 200, body: { ok: true } })
  }
  assert.equal(rows.length + mails.length, 0)
})

test('Begrenzung: die sechste Anfrage derselben Quelle wird abgelehnt', async () => {
  const { deps, rows } = setup()
  for (let i = 1; i <= 5; i += 1) {
    assert.equal(
      (
        await handleInquiry(
          input({ type: 'kontakt', message: `Nr ${i}` }),
          deps,
        )
      ).status,
      200,
    )
  }
  const sixth = await handleInquiry(
    input({ type: 'kontakt', message: 'Nr 6' }),
    deps,
  )
  assert.equal(sixth.status, 429)
  assert.equal(sixth.body.error, 'rate_limited')
  assert.equal(rows.length, 5)
})

test('Begrenzung gilt je Absender, andere Quellen sind nicht betroffen', async () => {
  const { deps } = setup()
  for (let i = 0; i < 6; i += 1)
    await handleInquiry(input({ type: 'kontakt', message: 'x' }), deps)
  const other = { ...deps, senderKey: 'andere' }
  assert.equal(
    (await handleInquiry(input({ type: 'kontakt', message: 'x' }), other))
      .status,
    200,
  )
})

test('Fällt der E-Mail-Versand aus, bleibt die Anfrage gespeichert und gilt als angenommen', async () => {
  const { deps, rows, logs } = setup({
    mail: {
      send: async () => {
        throw new Error('Resend 500')
      },
    },
  })
  const result = await handleInquiry(
    input({ type: 'kontakt', message: 'x' }),
    deps,
  )
  assert.deepEqual(result, { status: 200, body: { ok: true } })
  assert.equal(rows.length, 1)
  assert.equal(logs.length, 2)
})
