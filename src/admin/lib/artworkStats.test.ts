import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  aggregateArtworkStats,
  artworkHasActivity,
  sortArtworkRows,
  topArtworks,
  type ArtworkInfo,
  type ArtworkStatRow,
} from './artworkStats.ts'

const artworks: ArtworkInfo[] = [
  {
    id: 'a',
    title_de: 'Gössweinstein',
    main_image_url: 'a.webp',
    thumb_url: 'a-800.webp',
  },
  {
    id: 'b',
    title_de: 'Triptychon',
    main_image_url: 'b.webp',
    thumb_url: null,
  },
  { id: 'c', title_de: null, main_image_url: null, thumb_url: null },
]
const stat = (
  id: string,
  day: string,
  v: number,
  c: number,
  l: number,
  i = 0,
): ArtworkStatRow => ({
  artwork_id: id,
  day,
  views: v,
  clicks: c,
  lightbox_opens: l,
  inquiries: i,
})
const stats = [
  stat('a', '2027-03-01', 40, 10, 4, 1),
  stat('a', '2027-03-20', 20, 6, 2, 0),
  stat('b', '2027-03-20', 100, 15, 1, 0),
  stat('zz', '2027-03-20', 9, 9, 9, 9),
]
const inquiries = [
  { artwork_id: 'a', created_at: '2027-03-02T10:00:00.000Z' },
  { artwork_id: 'a', created_at: '2027-03-21T10:00:00.000Z' },
  { artwork_id: null, created_at: '2027-03-21T10:00:00.000Z' },
]

test('Zähler und Anfragen je Werk, Unbekanntes ignoriert', () => {
  const { rows, totals } = aggregateArtworkStats(stats, artworks, inquiries)
  const a = rows.find((r) => r.artworkId === 'a')!
  assert.deepEqual(
    [a.views, a.clicks, a.lightboxOpens, a.inquiryClicks, a.inquiries],
    [60, 16, 6, 1, 2],
  )
  assert.equal(a.imageUrl, 'a-800.webp')
  assert.equal(rows.find((r) => r.artworkId === 'b')!.imageUrl, 'b.webp')
  assert.deepEqual(totals, {
    views: 160,
    clicks: 31,
    lightboxOpens: 7,
    inquiryClicks: 1,
    inquiries: 2,
  })
  assert.equal(rows.length, 3)
})

test('Zeitraum begrenzt Zähler und Anfragen', () => {
  const since = { day: '2027-03-15', iso: '2027-03-15T00:00:00.000Z' }
  const { rows } = aggregateArtworkStats(stats, artworks, inquiries, since)
  const a = rows.find((r) => r.artworkId === 'a')!
  assert.deepEqual([a.views, a.inquiries], [20, 1])
})

test('Werke ohne Aufrufe erscheinen mit Nullen', () => {
  const { rows } = aggregateArtworkStats(stats, artworks, inquiries)
  assert.equal(
    artworkHasActivity(rows.find((r) => r.artworkId === 'c')!),
    false,
  )
  assert.equal(artworkHasActivity(rows.find((r) => r.artworkId === 'a')!), true)
})

test('Sortierung nach Interesse und Spalte', () => {
  const { rows } = aggregateArtworkStats(stats, artworks, inquiries)
  assert.deepEqual(
    sortArtworkRows(rows, 'interest').map((r) => r.artworkId),
    ['a', 'b', 'c'],
  )
  assert.deepEqual(
    sortArtworkRows(rows, 'views').map((r) => r.artworkId),
    ['b', 'a', 'c'],
  )
  assert.deepEqual(
    sortArtworkRows(rows, 'views', false).map((r) => r.artworkId),
    ['c', 'a', 'b'],
  )
})

test('Beliebteste Werke: nur mit Interesse, begrenzt', () => {
  const { rows } = aggregateArtworkStats(stats, artworks, inquiries)
  assert.deepEqual(
    topArtworks(rows).map((r) => r.artworkId),
    ['a', 'b'],
  )
  assert.deepEqual(
    topArtworks(rows, 1).map((r) => r.artworkId),
    ['a'],
  )
  assert.deepEqual(topArtworks([]), [])
})
