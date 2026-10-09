import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSitemap, detailEntries, STATIC_PATHS } from './sitemap.ts'

test('Sitemap: statische Seiten, Werke, Beiträge, Veranstaltungen; ohne Admin', () => {
  const xml = buildSitemap('https://beispiel.de/', [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...detailEntries('/galerie', [{ slug: 'goessweinstein' }]),
    ...detailEntries('/journal', [
      { slug: 'strich', updated_at: '2026-09-15T09:00:00Z' },
    ]),
    ...detailEntries('/veranstaltungen', [{ slug: 'abend' }]),
  ])
  assert.equal(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), true)
  assert.equal(xml.includes('<loc>https://beispiel.de/</loc>'), true)
  assert.equal(
    xml.includes('<loc>https://beispiel.de/galerie/goessweinstein</loc>'),
    true,
  )
  assert.equal(
    xml.includes('<loc>https://beispiel.de/veranstaltungen/abend</loc>'),
    true,
  )
  assert.equal(
    xml.includes(
      '<loc>https://beispiel.de/journal/strich</loc><lastmod>2026-09-15</lastmod>',
    ),
    true,
  )
  assert.equal(xml.includes('/admin'), false)
  assert.equal(xml.includes('/abmelden'), false)
  assert.equal(xml.includes('//galerie'), false)
})

test('Sitemap: Sonderzeichen, doppelte Pfade, fehlende Namen, ungültiges Datum', () => {
  const entries = detailEntries('/galerie', [
    { slug: 'a&b' },
    { slug: 'a&b' },
    { slug: null },
    { slug: 'ü x', updated_at: 'kaputt' },
  ])
  const xml = buildSitemap('https://beispiel.de', entries)
  assert.equal((xml.match(/<url>/g) ?? []).length, 2)
  assert.equal(xml.includes('a%26b'), true)
  assert.equal(xml.includes('%C3%BC%20x'), true)
  assert.equal(xml.includes('lastmod'), false)
})
