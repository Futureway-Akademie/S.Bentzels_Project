import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  countByStatus,
  emptyInquiryFilters,
  filterInquiries,
  mailtoReply,
  newestFirst,
  payloadEntries,
  replySubject,
  type InquiryRow,
} from './inquiryList.ts'

const row = (id: string, extra: Partial<InquiryRow> = {}): InquiryRow => ({
  id,
  created_at: '2026-10-01T10:00:00Z',
  type: 'kontakt',
  name: 'Anna',
  email: 'anna@example.com',
  phone: null,
  company: null,
  message: null,
  payload: null,
  artwork_id: null,
  event_id: null,
  persons: null,
  status: 'neu',
  ...extra,
})

const rows = [
  row('1', {
    type: 'werk',
    name: 'Bernd Sammler',
    message: 'Interesse am Triptychon',
  }),
  row('2', {
    type: 'veranstaltung',
    status: 'beantwortet',
    company: 'Beispiel GmbH',
  }),
  row('3', { type: 'kontakt', status: 'erledigt', email: 'clara@example.org' }),
]

test('Filter nach Art, Status und Suchtext', () => {
  const ids = (f: Partial<typeof emptyInquiryFilters>) =>
    filterInquiries(rows, { ...emptyInquiryFilters, ...f }).map((r) => r.id)
  assert.deepEqual(ids({}), ['1', '2', '3'])
  assert.deepEqual(ids({ type: 'werk' }), ['1'])
  assert.deepEqual(ids({ status: 'erledigt' }), ['3'])
  assert.deepEqual(ids({ type: 'kontakt', status: 'neu' }), [])
  assert.deepEqual(ids({ query: 'triptychon' }), ['1'])
  assert.deepEqual(ids({ query: 'beispiel gmbh' }), ['2'])
  assert.deepEqual(ids({ query: 'CLARA@' }), ['3'])
  assert.deepEqual(ids({ query: '  ' }), ['1', '2', '3'])
})

test('Zähler je Status', () => {
  assert.deepEqual(countByStatus(rows), { neu: 1, beantwortet: 1, erledigt: 1 })
  assert.deepEqual(countByStatus([]), { neu: 0, beantwortet: 0, erledigt: 0 })
})

test('Neueste zuerst', () => {
  const sorted = newestFirst([
    row('a', { created_at: '2026-01-01T00:00:00Z' }),
    row('b', { created_at: '2026-03-01T00:00:00Z' }),
    row('c', { created_at: '2026-02-01T00:00:00Z' }),
  ])
  assert.deepEqual(
    sorted.map((r) => r.id),
    ['b', 'c', 'a'],
  )
})

test('Antwort per E-Mail: Betreff mit Bezug oder nach Art, Adresse maskiert', () => {
  assert.equal(replySubject(rows[0], 'Gössweinstein'), 'Re: Gössweinstein')
  assert.equal(replySubject(rows[0], null), 'Ihre Werkanfrage')
  assert.equal(replySubject(rows[2], null), 'Ihre Nachricht')
  assert.equal(
    mailtoReply(rows[0], 'Re: Gössweinstein & Co'),
    'mailto:anna@example.com?subject=Re%3A%20G%C3%B6ssweinstein%20%26%20Co',
  )
})

test('Zusatzangaben ohne leere Werte', () => {
  assert.deepEqual(payloadEntries(null), [])
  assert.deepEqual(payloadEntries({ a: 'x', b: '', c: null, d: true, e: 3 }), [
    ['a', 'x'],
    ['d', 'ja'],
    ['e', '3'],
  ])
})
