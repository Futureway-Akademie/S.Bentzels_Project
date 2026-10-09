import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  aggregateEventStats,
  hasActivity,
  share,
  sinceDay,
  sinceIso,
  sortRows,
  type EventInfo,
  type InquiryRow,
  type StatRow,
} from './eventStats.ts'

const events: EventInfo[] = [
  { id: 'a', title_de: 'Aktzeichnen', starts_at: null, status: 'geplant' },
  { id: 'b', title_de: 'Vortrag', starts_at: null, status: 'geplant' },
  { id: 'c', title_de: 'Workshop', starts_at: null, status: 'geplant' },
]
const stat = (
  event_id: string,
  day: string,
  v: number,
  d: number,
  c: number,
  i = 0,
): StatRow => ({
  event_id,
  day,
  views: v,
  detail_opens: d,
  inquiry_clicks: c,
  inquiries: i,
})
const stats = [
  stat('a', '2027-03-01', 10, 4, 1),
  stat('a', '2027-03-20', 5, 3, 2),
  stat('b', '2027-03-20', 30, 12, 0),
  stat('zz', '2027-03-20', 99, 99, 99),
]
const inquiries: InquiryRow[] = [
  { event_id: 'a', created_at: '2027-03-02T10:00:00.000Z' },
  { event_id: 'a', created_at: '2027-03-21T10:00:00.000Z' },
  { event_id: null, created_at: '2027-03-21T10:00:00.000Z' },
  { event_id: 'b', created_at: '2027-02-01T10:00:00.000Z' },
]

test('Zähler und Anfragen werden je Veranstaltung addiert, Unbekanntes ignoriert', () => {
  const { rows, totals } = aggregateEventStats(stats, events, inquiries)
  const a = rows.find((r) => r.eventId === 'a')!
  assert.deepEqual(
    [a.views, a.detailOpens, a.inquiryClicks, a.inquiries],
    [15, 7, 3, 2],
  )
  assert.equal(rows.length, 3)
  assert.deepEqual(totals, {
    views: 45,
    detailOpens: 19,
    inquiryClicks: 3,
    inquiries: 3,
  })
})

test('Zeitraum begrenzt Zähler (Tag) und Anfragen (Zeitpunkt)', () => {
  const now = new Date(2027, 2, 21, 12)
  assert.equal(sinceDay(7, now), '2027-03-15')
  assert.equal(sinceDay(null, now), null)
  assert.equal(sinceDay(1, now), '2027-03-21')
  const since = { day: sinceDay(7, now), iso: sinceIso(7, now) }
  const { rows } = aggregateEventStats(stats, events, inquiries, since)
  const a = rows.find((r) => r.eventId === 'a')!
  assert.deepEqual([a.views, a.inquiryClicks, a.inquiries], [5, 2, 1])
  assert.equal(rows.find((r) => r.eventId === 'b')!.inquiries, 0)
})

test('Veranstaltungen ohne Aufrufe erscheinen mit Nullen', () => {
  const { rows } = aggregateEventStats(stats, events, inquiries)
  const c = rows.find((r) => r.eventId === 'c')!
  assert.equal(hasActivity(c), false)
  assert.equal(hasActivity(rows.find((r) => r.eventId === 'a')!), true)
})

test('Sortierung nach Interesse, Spalte und Titel', () => {
  const { rows } = aggregateEventStats(stats, events, inquiries)
  assert.deepEqual(
    sortRows(rows, 'interest').map((r) => r.eventId),
    ['a', 'b', 'c'],
  )
  assert.deepEqual(
    sortRows(rows, 'views').map((r) => r.eventId),
    ['b', 'a', 'c'],
  )
  assert.deepEqual(
    sortRows(rows, 'views', false).map((r) => r.eventId),
    ['c', 'a', 'b'],
  )
  assert.deepEqual(
    sortRows(rows, 'title', false).map((r) => r.title),
    ['Aktzeichnen', 'Vortrag', 'Workshop'],
  )
  assert.deepEqual(
    sortRows(rows, 'title').map((r) => r.title),
    ['Workshop', 'Vortrag', 'Aktzeichnen'],
  )
})

test('Anteil in Prozent', () => {
  assert.equal(share(1, 4), 25)
  assert.equal(share(2, 3), 67)
  assert.equal(share(1, 0), null)
})
