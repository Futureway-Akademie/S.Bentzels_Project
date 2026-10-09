import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultGalleryVisibility,
  parseGalleryVisibility,
} from './gallerySettings.ts'

test('Ohne Eintrag ist alles sichtbar', () => {
  assert.deepEqual(parseGalleryVisibility(null), defaultGalleryVisibility)
  assert.deepEqual(parseGalleryVisibility(undefined), defaultGalleryVisibility)
  assert.deepEqual(parseGalleryVisibility({}), defaultGalleryVisibility)
})

test('Nur ein ausdrückliches false blendet aus, Unbekanntes wird ignoriert', () => {
  const result = parseGalleryVisibility({
    price: false,
    year: 'nein',
    neu: false,
  })
  assert.equal(result.price, false)
  assert.equal(result.year, true)
  assert.equal(result.dimensions, true)
  assert.equal('neu' in result, false)
})
