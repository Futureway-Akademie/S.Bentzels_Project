import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  asFlags,
  flagValues,
  VISIBILITY_GROUPS,
  withFlag,
} from './visibility.ts'

const gallery = VISIBILITY_GROUPS.find((g) => g.id === 'gallery')!
const events = VISIBILITY_GROUPS.find((g) => g.id === 'events')!

test('Alle Schalter laut Prompt sind vorhanden', () => {
  assert.deepEqual(
    gallery.flags.map((f) => f.key),
    ['price', 'dimensions', 'technique', 'year', 'availability', 'description'],
  )
  assert.deepEqual(
    events.flags.map((f) => f.key),
    ['price', 'free_places', 'participants', 'speaker', 'location'],
  )
  assert.equal(gallery.setting, 'gallery_visibility')
  assert.equal(events.setting, 'event_visibility')
})

test('Ohne Eintrag ist alles sichtbar, nur ausdrückliches false blendet aus', () => {
  assert.equal(
    Object.values(flagValues(undefined, gallery)).every(Boolean),
    true,
  )
  assert.equal(Object.values(flagValues({}, events)).every(Boolean), true)
  const values = flagValues(
    { price: false, year: 'nein', dimensions: null },
    gallery,
  )
  assert.equal(values.price, false)
  assert.equal(values.year, true)
  assert.equal(values.dimensions, true)
})

test('Ein Schalter ändert nur sich selbst und behält unbekannte Einträge', () => {
  const next = withFlag({ price: true, neu: false }, 'price', false)
  assert.deepEqual(next, { price: false, neu: false })
  assert.deepEqual(withFlag(undefined, 'year', false), { year: false })
  const original = { price: true }
  withFlag(original, 'price', false)
  assert.deepEqual(original, { price: true })
})

test('Nur Objekte gelten als Schalter-Einträge', () => {
  assert.deepEqual(asFlags({ a: 1 }), { a: 1 })
  assert.deepEqual(asFlags(null), {})
  assert.deepEqual(asFlags([1, 2]), {})
  assert.deepEqual(asFlags('x'), {})
})
