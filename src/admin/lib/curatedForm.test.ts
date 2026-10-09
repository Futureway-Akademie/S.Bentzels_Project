import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  curatedFormFromRow,
  hostOf,
  isWebUrl,
  toCuratedPayload,
  validateCuratedForm,
} from './curatedForm.ts'

const form = (extra: Partial<ReturnType<typeof curatedFormFromRow>> = {}) => ({
  ...curatedFormFromRow({}),
  url: 'https://example.com/artikel',
  ...extra,
})

test('Nur der Link ist Pflicht', () => {
  assert.deepEqual(validateCuratedForm(form()), {})
  assert.equal(validateCuratedForm(form({ url: '' })).url, 'required')
  assert.equal(validateCuratedForm(form({ url: '   ' })).url, 'required')
})

test('Links müssen mit http oder https beginnen', () => {
  assert.equal(isWebUrl('https://example.com'), true)
  assert.equal(isWebUrl(' http://example.com/a?b=1 '), true)
  assert.equal(isWebUrl('example.com'), false)
  assert.equal(isWebUrl('javascript:alert(1)'), false)
  assert.equal(isWebUrl('https://exa mple.com'), false)
  assert.equal(
    validateCuratedForm(form({ url: 'ftp://x.de' })).url,
    'urlInvalid',
  )
})

test('Zu lange Angaben werden abgelehnt', () => {
  assert.equal(
    validateCuratedForm(form({ title_de: 'x'.repeat(301) })).title_de,
    'tooLong',
  )
  assert.equal(
    validateCuratedForm(form({ source: 'x'.repeat(201) })).source,
    'tooLong',
  )
  assert.equal(
    validateCuratedForm(form({ note_de: 'x'.repeat(2001) })).note_de,
    'tooLong',
  )
})

test('Leere Angaben werden zu NULL', () => {
  assert.deepEqual(toCuratedPayload(form()), {
    url: 'https://example.com/artikel',
    title_de: null,
    source: null,
    note_de: null,
  })
  assert.equal(
    toCuratedPayload(form({ title_de: '  Titel ' })).title_de,
    'Titel',
  )
})

test('Domain als Ersatz für den Titel', () => {
  assert.equal(hostOf('https://www.example.com/a/b'), 'example.com')
  assert.equal(hostOf('https://blog.example.org'), 'blog.example.org')
  assert.equal(hostOf('kein link'), 'kein link')
})
