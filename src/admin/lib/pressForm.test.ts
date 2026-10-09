import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fileKind,
  pressFormFromRow,
  toPressPayload,
  validatePressForm,
  type PressFormValues,
} from './pressForm.ts'

const empty: PressFormValues = pressFormFromRow({})
const with_ = (extra: Partial<PressFormValues>): PressFormValues => ({
  ...empty,
  ...extra,
})

test('Mit Datei sind alle Angaben optional, ohne Datei ist ein Link Pflicht', () => {
  assert.deepEqual(validatePressForm(empty, true), {})
  assert.equal(validatePressForm(empty, false).external_url, 'needsSource')
  assert.deepEqual(
    validatePressForm(with_({ external_url: 'https://example.com/a' }), false),
    {},
  )
})

test('Link, Jahr, Datum und Länge werden geprüft', () => {
  assert.equal(
    validatePressForm(with_({ external_url: 'javascript:x' }), true)
      .external_url,
    'urlInvalid',
  )
  assert.equal(
    validatePressForm(with_({ external_url: 'example.com' }), true)
      .external_url,
    'urlInvalid',
  )
  assert.equal(
    validatePressForm(with_({ year: '99' }), true).year,
    'yearInvalid',
  )
  assert.equal(
    validatePressForm(with_({ year: '3000' }), true).year,
    'yearInvalid',
  )
  assert.deepEqual(validatePressForm(with_({ year: '2019' }), true), {})
  assert.equal(
    validatePressForm(with_({ published_at: '2020-02-30' }), true).published_at,
    'dateInvalid',
  )
  assert.equal(
    validatePressForm(with_({ published_at: '31.01.2020' }), true).published_at,
    'dateInvalid',
  )
  assert.deepEqual(
    validatePressForm(with_({ published_at: '2020-02-29' }), true),
    {},
  )
  assert.equal(
    validatePressForm(with_({ title_de: 'x'.repeat(301) }), true).title_de,
    'tooLong',
  )
})

test('Leere Angaben werden zu NULL, das Jahr folgt dem Datum', () => {
  const payload = toPressPayload(empty)
  assert.equal(payload.title_de, null)
  assert.equal(payload.medium_type, null)
  assert.equal(payload.year, null)
  assert.equal(payload.is_published, false)
  assert.equal(toPressPayload(with_({ published_at: '2018-05-04' })).year, 2018)
  assert.equal(
    toPressPayload(with_({ published_at: '2018-05-04', year: '2020' })).year,
    2020,
  )
  assert.equal(
    toPressPayload(with_({ title_de: '  Titel  ', medium_type: 'magazin' }))
      .title_de,
    'Titel',
  )
})

test('Formular aus Zeile', () => {
  const form = pressFormFromRow({
    title_de: 'A',
    year: 2019,
    medium_type: 'zeitung',
    is_highlight: true,
  })
  assert.equal(form.year, '2019')
  assert.equal(form.medium_type, 'zeitung')
  assert.equal(form.is_highlight, true)
})

test('Dateiart wird am Typ oder an der Endung erkannt', () => {
  assert.equal(fileKind({ name: 'a.pdf', type: 'application/pdf' }), 'pdf')
  assert.equal(fileKind({ name: 'a.PDF', type: '' }), 'pdf')
  assert.equal(fileKind({ name: 'a.jpg', type: 'image/jpeg' }), 'image')
  assert.equal(fileKind({ name: 'foto.PNG', type: '' }), 'image')
  assert.equal(fileKind({ name: 'a.gif', type: 'image/gif' }), null)
  assert.equal(fileKind({ name: 'a.docx', type: '' }), null)
})
