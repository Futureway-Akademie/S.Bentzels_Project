import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fieldErrors, submissionSchema } from './schemas.ts'

const base = {
  name: 'Erika Muster',
  email: 'erika@example.com',
  consent: true as const,
  startedAt: 1_000,
}
const uuid = '11111111-1111-4111-8111-111111111111'

test('Kontakt: Name, E-Mail und Nachricht sind Pflicht', () => {
  const ok = submissionSchema.safeParse({
    ...base,
    type: 'kontakt',
    message: 'Hallo',
  })
  assert.equal(ok.success, true)
  const bad = submissionSchema.safeParse({ ...base, type: 'kontakt' })
  assert.equal(bad.success, false)
  assert.equal(fieldErrors(bad.error!).message, 'required')
})

test('Pflichtfelder fehlen: Fehlercodes je Feld', () => {
  const result = submissionSchema.safeParse({
    type: 'kontakt',
    startedAt: 1,
    consent: true,
    message: 'x',
  })
  assert.equal(result.success, false)
  const errors = fieldErrors(result.error!)
  assert.equal(errors.name, 'required')
  assert.equal(errors.email, 'required')
})

test('E-Mail wird geprüft', () => {
  const result = submissionSchema.safeParse({
    ...base,
    email: 'kein-at',
    type: 'kontakt',
    message: 'x',
  })
  assert.equal(result.success, false)
  assert.equal(fieldErrors(result.error!).email, 'email')
})

test('Ohne Zustimmung zur Datenschutzerklärung keine Anfrage', () => {
  for (const consent of [false, undefined, 'ja', 1]) {
    const result = submissionSchema.safeParse({
      ...base,
      consent,
      type: 'kontakt',
      message: 'x',
    })
    assert.equal(result.success, false)
    assert.equal(fieldErrors(result.error!).consent, 'consent')
  }
})

test('Eingaben werden gekürzt und zu lange abgelehnt, leere gelten als fehlend', () => {
  const ok = submissionSchema.safeParse({
    ...base,
    name: '  Erika  ',
    phone: '   ',
    type: 'kontakt',
    message: ' Hi ',
  })
  assert.equal(ok.success, true)
  if (ok.success) {
    assert.equal(ok.data.name, 'Erika')
    assert.equal(ok.data.phone, undefined)
    assert.equal(ok.data.message, 'Hi')
  }
  const long = submissionSchema.safeParse({
    ...base,
    name: 'x'.repeat(201),
    type: 'kontakt',
    message: 'x',
  })
  assert.equal(long.success, false)
  assert.equal(fieldErrors(long.error!).name, 'tooLong')
})

test('Werk braucht eine gültige Werkkennung', () => {
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'werk', artworkId: uuid })
      .success,
    true,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'werk', artworkId: 'abc' })
      .success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'werk' }).success,
    false,
  )
})

test('The Art of Becoming: Unternehmen Pflicht, Auswahlfelder begrenzt', () => {
  const ok = submissionSchema.safeParse({
    ...base,
    type: 'seminar',
    company: 'Beispiel GmbH',
    participants: 'm',
    location: 'offen',
  })
  assert.equal(ok.success, true)
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'seminar' }).success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'seminar',
      company: 'X',
      participants: '1000',
    }).success,
    false,
  )
})

test('Vortrag: Organisation Pflicht', () => {
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'vortrag',
      organization: 'Verein',
      topic: 'Individuell',
    }).success,
    true,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'vortrag' }).success,
    false,
  )
})

test('Kunstkurs: Termin Pflicht, Personen und Vorerfahrung begrenzt', () => {
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'kunstkurs',
      course: 'individuell',
      persons: '3',
      experience: 'etwas',
    }).success,
    true,
  )
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'kunstkurs',
      course: 'individuell',
      persons: 0,
    }).success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'kunstkurs',
      course: 'individuell',
      persons: 1000,
    }).success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'kunstkurs',
      course: 'individuell',
      experience: 'profi',
    }).success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'kunstkurs' }).success,
    false,
  )
})

test('Club, Veranstaltung und unbekannte Art', () => {
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'bentzel_club',
      meaning: 'Vieles',
    }).success,
    true,
  )
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      type: 'veranstaltung',
      eventId: uuid,
      persons: 2,
      interest: true,
    }).success,
    true,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'veranstaltung', eventId: 'x' })
      .success,
    false,
  )
  assert.equal(
    submissionSchema.safeParse({ ...base, type: 'unbekannt' }).success,
    false,
  )
})

test('Köderfeld und Zeitstempel sind erlaubte Felder', () => {
  const result = submissionSchema.safeParse({
    ...base,
    type: 'kontakt',
    message: 'x',
    website: 'spam',
  })
  assert.equal(result.success, true)
  assert.equal(
    submissionSchema.safeParse({
      ...base,
      startedAt: -1,
      type: 'kontakt',
      message: 'x',
    }).success,
    false,
  )
})
