import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cropToPixels,
  extensionFor,
  fitWithin,
  groupByBucket,
  isAllowedImageType,
  looksLikePdf,
  parsePublicUrl,
} from './imageMath.ts'

test('fitWithin verkleinert die längste Kante und behält das Seitenverhältnis', () => {
  assert.deepEqual(fitWithin(4000, 3000, 2400), { width: 2400, height: 1800 })
  assert.deepEqual(fitWithin(3000, 4000, 2400), { width: 1800, height: 2400 })
  assert.deepEqual(fitWithin(5000, 5000, 800), { width: 800, height: 800 })
  assert.deepEqual(fitWithin(6000, 1000, 2400), { width: 2400, height: 400 })
})

test('fitWithin skaliert nie hoch', () => {
  assert.deepEqual(fitWithin(500, 300, 2400), { width: 500, height: 300 })
  assert.deepEqual(fitWithin(2400, 2400, 2400), { width: 2400, height: 2400 })
})

test('fitWithin liefert nie 0 Pixel', () => {
  assert.deepEqual(fitWithin(100000, 1, 800), { width: 800, height: 1 })
})

test('cropToPixels rechnet Anteile um und begrenzt auf das Bild', () => {
  assert.deepEqual(
    cropToPixels(1000, 500, { x: 0.1, y: 0.2, width: 0.5, height: 0.5 }),
    {
      sx: 100,
      sy: 100,
      sw: 500,
      sh: 250,
    },
  )
  assert.deepEqual(
    cropToPixels(1000, 500, { x: 0.8, y: 0.8, width: 0.5, height: 0.5 }),
    {
      sx: 800,
      sy: 400,
      sw: 200,
      sh: 100,
    },
  )
  assert.deepEqual(
    cropToPixels(1000, 500, { x: -1, y: 2, width: 0, height: 0 }),
    {
      sx: 0,
      sy: 500,
      sw: 1,
      sh: 1,
    },
  )
})

test('isAllowedImageType erlaubt nur JPEG, PNG und WebP', () => {
  assert.equal(isAllowedImageType('image/jpeg'), true)
  assert.equal(isAllowedImageType('image/png'), true)
  assert.equal(isAllowedImageType('image/webp'), true)
  assert.equal(isAllowedImageType('image/svg+xml'), false)
  assert.equal(isAllowedImageType('image/gif'), false)
  assert.equal(isAllowedImageType('text/html'), false)
})

test('looksLikePdf erkennt die PDF-Kennung', () => {
  assert.equal(looksLikePdf(new TextEncoder().encode('%PDF-1.4\n...')), true)
  assert.equal(looksLikePdf(new TextEncoder().encode('<html>')), false)
  assert.equal(looksLikePdf(new Uint8Array([])), false)
})

test('parsePublicUrl zerlegt Supabase-Adressen', () => {
  assert.deepEqual(
    parsePublicUrl(
      'https://abc.supabase.co/storage/v1/object/public/artworks/w1/a.webp',
    ),
    {
      bucket: 'artworks',
      path: 'w1/a.webp',
    },
  )
  assert.deepEqual(
    parsePublicUrl(
      'http://localhost:54321/storage/v1/object/public/press/p%201/b.pdf',
    ),
    {
      bucket: 'press',
      path: 'p 1/b.pdf',
    },
  )
  assert.equal(parsePublicUrl('https://example.com/bild.jpg'), null)
  assert.equal(parsePublicUrl('data:image/svg+xml;utf8,abc'), null)
  assert.equal(parsePublicUrl(null), null)
  assert.equal(
    parsePublicUrl('https://abc.supabase.co/storage/v1/object/public/artworks'),
    null,
  )
})

test('groupByBucket gruppiert, entfernt Duplikate und ignoriert fremde Adressen', () => {
  const base = 'https://abc.supabase.co/storage/v1/object/public'
  assert.deepEqual(
    groupByBucket([
      `${base}/artworks/w1/a.webp`,
      `${base}/artworks/w1/a.webp`,
      `${base}/artworks/w1/a-800.webp`,
      `${base}/press/p1/b.pdf`,
      'https://example.com/fremd.jpg',
      null,
      undefined,
    ]),
    { artworks: ['w1/a.webp', 'w1/a-800.webp'], press: ['p1/b.pdf'] },
  )
})

test('extensionFor', () => {
  assert.equal(extensionFor('image/webp'), 'webp')
  assert.equal(extensionFor('image/jpeg'), 'jpg')
  assert.equal(extensionFor('application/pdf'), 'pdf')
  assert.equal(extensionFor('text/plain'), 'bin')
})
