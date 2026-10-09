import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSrcSet, parseVariants, variantEdgesFor } from './imageVariants.ts'

test('Liste lesen: nur gültige Einträge, nach Breite sortiert', () => {
  assert.deepEqual(
    parseVariants([
      { url: 'b-1600.webp', width: 1600 },
      { url: 'a-800.webp', width: 800 },
      { url: '', width: 5 },
      { url: 'x', width: 0 },
      { url: 'y', width: 'breit' },
      null,
      'text',
    ]),
    [
      { url: 'a-800.webp', width: 800 },
      { url: 'b-1600.webp', width: 1600 },
    ],
  )
  for (const bad of [null, undefined, {}, 'x', 5])
    assert.deepEqual(parseVariants(bad), [])
})

test('Fassungen entstehen nur unterhalb der längsten Kante', () => {
  assert.deepEqual(variantEdgesFor(2400, 1600), [800, 1600])
  assert.deepEqual(variantEdgesFor(1600, 900), [800])
  assert.deepEqual(variantEdgesFor(1200, 3000), [800, 1600])
  assert.deepEqual(variantEdgesFor(800, 600), [])
  assert.deepEqual(variantEdgesFor(500, 400), [])
})

test('srcset: kleinere Fassungen plus Hauptdatei, sonst keine Liste', () => {
  const variants = [
    { url: 'm-800.webp', width: 800 },
    { url: 'm-1600.webp', width: 1600 },
  ]
  assert.equal(
    buildSrcSet('m.webp', 2400, variants),
    'm-800.webp 800w, m-1600.webp 1600w, m.webp 2400w',
  )
  assert.equal(
    buildSrcSet('m.webp', 1000, variants),
    'm-800.webp 800w, m.webp 1000w',
  )
  assert.equal(buildSrcSet('m.webp', 800, variants), undefined)
  assert.equal(buildSrcSet('m.webp', 2400, []), undefined)
  assert.equal(buildSrcSet('m.webp', null, variants), undefined)
})
