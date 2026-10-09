import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fromRow,
  parseNumber,
  toPayload,
  validateArtworkForm,
  type ArtworkFormValues,
} from './artworkForm.ts'
import {
  ASPECTS,
  clampCrop,
  cropForAspect,
  isFullCrop,
  moveCrop,
  parseCrop,
  resizeCrop,
} from './cropMath.ts'
import { moveBefore, moveItem, nextSortOrder, sortUpdates } from './order.ts'
import { slugify, uniqueSlug } from './slug.ts'

const empty: ArtworkFormValues = fromRow({})

test('slugify löst Umlaute auf und trennt mit Bindestrichen', () => {
  assert.equal(
    slugify('Das jüngste Gericht nach Michelangelo'),
    'das-juengste-gericht-nach-michelangelo',
  )
  assert.equal(slugify('Gössweinstein'), 'goessweinstein')
  assert.equal(slugify('  Flower  II!  '), 'flower-ii')
  assert.equal(slugify('Straße & Café'), 'strasse-cafe')
  assert.equal(slugify('???'), '')
  assert.equal(slugify('A'.repeat(200)).length <= 80, true)
})

test('uniqueSlug zählt hoch, wenn der Slug vergeben ist', () => {
  assert.equal(uniqueSlug('flower', []), 'flower')
  assert.equal(uniqueSlug('flower', ['flower']), 'flower-2')
  assert.equal(
    uniqueSlug('flower', ['flower', 'flower-2', 'flower-3']),
    'flower-4',
  )
  assert.equal(uniqueSlug('flower', new Set(['anders'])), 'flower')
})

test('moveItem und moveBefore ordnen um', () => {
  assert.deepEqual(moveItem([1, 2, 3, 4], 0, 2), [2, 3, 1, 4])
  assert.deepEqual(moveItem([1, 2, 3], 5, 0), [1, 2, 3])
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  assert.deepEqual(
    moveBefore(items, 'd', 'b').map((i) => i.id),
    ['a', 'd', 'b', 'c'],
  )
  assert.deepEqual(
    moveBefore(items, 'a', 'c').map((i) => i.id),
    ['b', 'a', 'c', 'd'],
  )
  assert.deepEqual(
    moveBefore(items, 'a', 'a').map((i) => i.id),
    ['a', 'b', 'c', 'd'],
  )
  assert.deepEqual(
    moveBefore(items, 'x', 'b').map((i) => i.id),
    ['a', 'b', 'c', 'd'],
  )
})

test('sortUpdates meldet nur geänderte Positionen', () => {
  const ordered = [
    { id: 'a', sort_order: 1 },
    { id: 'c', sort_order: 3 },
    { id: 'b', sort_order: 2 },
    { id: 'd', sort_order: 4 },
  ]
  assert.deepEqual(sortUpdates(ordered), [
    { id: 'c', sort_order: 2 },
    { id: 'b', sort_order: 3 },
  ])
  assert.deepEqual(sortUpdates([{ id: 'x', sort_order: 0 }]), [
    { id: 'x', sort_order: 1 },
  ])
  assert.deepEqual(sortUpdates([]), [])
})

test('nextSortOrder', () => {
  assert.equal(nextSortOrder([]), 1)
  assert.equal(nextSortOrder([{ sort_order: 3 }, { sort_order: 7 }]), 8)
})

test('cropForAspect liefert den größten zentrierten Ausschnitt', () => {
  assert.deepEqual(cropForAspect(4000, 3000, null), {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  })
  const square = cropForAspect(4000, 3000, 1)
  assert.ok(Math.abs(square.width * 4000 - square.height * 3000) < 1e-6)
  assert.equal(square.height, 1)
  assert.ok(Math.abs(square.x - (1 - square.width) / 2) < 1e-9)
  const wide = cropForAspect(1000, 1000, 16 / 9)
  assert.equal(wide.width, 1)
  assert.ok(Math.abs(wide.height - 9 / 16) < 1e-9)
})

test('clampCrop und moveCrop halten den Ausschnitt im Bild', () => {
  assert.deepEqual(clampCrop({ x: -1, y: 2, width: 0.5, height: 0.5 }), {
    x: 0,
    y: 0.5,
    width: 0.5,
    height: 0.5,
  })
  assert.deepEqual(
    moveCrop({ x: 0.5, y: 0.5, width: 0.4, height: 0.4 }, 0.5, -1),
    { x: 0.6, y: 0, width: 0.4, height: 0.4 },
  )
})

test('resizeCrop frei und mit festem Seitenverhältnis', () => {
  const free = resizeCrop(
    { x: 0.2, y: 0.2, width: 0.3, height: 0.3 },
    0.1,
    -0.1,
    1000,
    1000,
    null,
  )
  assert.ok(
    Math.abs(free.width - 0.4) < 1e-9 && Math.abs(free.height - 0.2) < 1e-9,
  )
  const tooBig = resizeCrop(
    { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
    5,
    5,
    1000,
    1000,
    null,
  )
  assert.ok(Math.abs(tooBig.x + tooBig.width - 1) < 1e-9)
  const fixed = resizeCrop(
    { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
    0.2,
    0,
    1000,
    1000,
    1,
  )
  assert.ok(
    Math.abs(fixed.width - 0.5) < 1e-9 && Math.abs(fixed.height - 0.5) < 1e-9,
  )
  const landscape = resizeCrop(
    { x: 0.1, y: 0.1, width: 0.4, height: 0.3 },
    0.1,
    0,
    4000,
    3000,
    ASPECTS['4:3'] as number,
  )
  assert.ok(
    Math.abs((landscape.width * 4000) / (landscape.height * 3000) - 4 / 3) <
      1e-9,
  )
  const limited = resizeCrop(
    { x: 0.7, y: 0.1, width: 0.2, height: 0.2 },
    1,
    1,
    1000,
    1000,
    1,
  )
  assert.ok(
    limited.x + limited.width <= 1 + 1e-9 &&
      limited.y + limited.height <= 1 + 1e-9,
  )
})

test('isFullCrop und parseCrop', () => {
  assert.equal(isFullCrop({ x: 0, y: 0, width: 1, height: 1 }), true)
  assert.equal(isFullCrop({ x: 0.1, y: 0, width: 0.9, height: 1 }), false)
  assert.deepEqual(parseCrop({ x: 0.1, y: 0.2, width: 0.5, height: 0.5 }), {
    x: 0.1,
    y: 0.2,
    width: 0.5,
    height: 0.5,
  })
  assert.equal(parseCrop(null), null)
  assert.equal(parseCrop({ x: 'a' }), null)
  assert.equal(parseCrop('text'), null)
})

test('parseNumber versteht Komma und Punkt', () => {
  assert.equal(parseNumber('43,5'), 43.5)
  assert.equal(parseNumber(' 120 '), 120)
  assert.equal(parseNumber(''), null)
  assert.ok(Number.isNaN(parseNumber('abc') as number))
  assert.ok(Number.isNaN(parseNumber('1,2,3') as number))
})

test('Leeres Formular ist gültig und ergibt nur NULL-Werte (Bild zuerst, alles optional)', () => {
  assert.deepEqual(validateArtworkForm(empty), {})
  const payload = toPayload(empty)
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'boolean') continue
    assert.equal(value, null, key)
  }
})

test('Validierung meldet ungültige Angaben', () => {
  const errors = validateArtworkForm({
    ...empty,
    year: '20',
    height_cm: 'abc',
    width_cm: '0',
    depth_cm: '-4',
    price_eur: '-1',
    title_de: 'x'.repeat(201),
    description_de: 'y'.repeat(5001),
  })
  assert.deepEqual(errors, {
    title_de: 'tooLong',
    description_de: 'tooLong',
    year: 'yearInvalid',
    height_cm: 'numberInvalid',
    width_cm: 'numberPositive',
    depth_cm: 'numberPositive',
    price_eur: 'priceInvalid',
  })
  assert.deepEqual(
    validateArtworkForm({
      ...empty,
      year: '2016',
      height_cm: '43,5',
      price_eur: '345',
    }),
    {},
  )
})

test('toPayload wandelt Texte, Zahlen und Auswahl um', () => {
  const payload = toPayload({
    ...empty,
    title_de: '  Poppy Picking ',
    year: '2016',
    height_cm: '140',
    width_cm: '150,5',
    price_eur: '3240',
    framed: 'nein',
    status: 'reserviert',
    is_highlight: true,
  })
  assert.equal(payload.title_de, 'Poppy Picking')
  assert.equal(payload.year, 2016)
  assert.equal(payload.width_cm, 150.5)
  assert.equal(payload.price_eur, 3240)
  assert.equal(payload.framed, false)
  assert.equal(payload.status, 'reserviert')
  assert.equal(payload.is_highlight, true)
  assert.equal(payload.artist, null)
})

test('fromRow und toPayload ergeben denselben Stand', () => {
  const row = {
    title_de: 'A',
    year: 2020,
    width_cm: 43.5,
    framed: true,
    status: 'verkauft' as const,
    is_published: true,
  }
  const values = fromRow(row)
  assert.equal(values.width_cm, '43,5')
  assert.equal(values.framed, 'ja')
  const payload = toPayload(values)
  assert.equal(payload.width_cm, 43.5)
  assert.equal(payload.framed, true)
  assert.equal(payload.status, 'verkauft')
})

import {
  extractImageUrls,
  isEmptyHtml,
  trimTrailingEmpty,
} from './htmlImages.ts'
import {
  fromLocalInput,
  postFormFromRow,
  toLocalInput,
  toPostPayload,
  validatePostForm,
} from './postForm.ts'
import {
  emptyVitaForm,
  sortVita,
  toVitaPayload,
  validateVitaForm,
  vitaFormFromRow,
} from './vitaForm.ts'

test('extractImageUrls findet alle Bilder ohne Duplikate', () => {
  const html =
    '<p>Text</p><img src="https://x.test/a.webp" alt="A" width="10"><p><img alt="B" src="https://x.test/b.webp"></p><img src="https://x.test/a.webp">'
  assert.deepEqual(extractImageUrls(html), [
    'https://x.test/a.webp',
    'https://x.test/b.webp',
  ])
  assert.deepEqual(extractImageUrls('<p>kein Bild</p>'), [])
})

test('isEmptyHtml erkennt leere Texte, Bilder zählen als Inhalt', () => {
  assert.equal(isEmptyHtml(''), true)
  assert.equal(isEmptyHtml(null), true)
  assert.equal(isEmptyHtml('<p></p>'), true)
  assert.equal(isEmptyHtml('<p><br></p><p>&nbsp;</p>'), true)
  assert.equal(isEmptyHtml('<p>Hallo</p>'), false)
  assert.equal(isEmptyHtml('<p></p><img src="x">'), false)
})

test('Datumsfeld wandelt hin und zurück um', () => {
  const iso = '2026-10-15T10:30:00.000Z'
  assert.equal(fromLocalInput(toLocalInput(iso)), iso)
  assert.equal(toLocalInput(null), '')
  assert.equal(fromLocalInput(''), null)
  assert.equal(fromLocalInput('kein Datum'), null)
})

test('Beitragsformular: Prüfung und Umwandlung', () => {
  const values = postFormFromRow({})
  assert.deepEqual(validatePostForm(values), {})
  assert.deepEqual(
    validatePostForm({
      ...values,
      title_de: 'x'.repeat(201),
      excerpt_de: 'y'.repeat(501),
      published_at: 'nope',
    }),
    {
      title_de: 'tooLong',
      excerpt_de: 'tooLong',
      published_at: 'dateInvalid',
    },
  )
  const now = new Date('2026-10-08T12:00:00.000Z')
  assert.deepEqual(toPostPayload(values, now), {
    title_de: null,
    excerpt_de: null,
    status: 'entwurf',
    published_at: null,
  })
  assert.equal(
    toPostPayload({ ...values, status: 'veroeffentlicht' }, now).published_at,
    now.toISOString(),
  )
  const dated = toPostPayload(
    {
      ...values,
      status: 'veroeffentlicht',
      published_at: toLocalInput('2026-01-02T08:00:00.000Z'),
    },
    now,
  )
  assert.equal(dated.published_at, '2026-01-02T08:00:00.000Z')
  assert.equal(
    toPostPayload({ ...values, title_de: '  Titel ' }, now).title_de,
    'Titel',
  )
})

test('Vita: Prüfung und Umwandlung', () => {
  const empty = emptyVitaForm('messe')
  assert.deepEqual(validateVitaForm(empty), {
    year: 'required',
    title_de: 'required',
  })
  assert.deepEqual(validateVitaForm({ ...empty, year: '19', title_de: 'x' }), {
    year: 'yearInvalid',
  })
  assert.deepEqual(
    validateVitaForm({
      ...empty,
      year: '2015',
      year_end: '2010',
      title_de: 'x',
    }),
    { year_end: 'yearEndBeforeStart' },
  )
  assert.deepEqual(
    validateVitaForm({
      ...empty,
      year: '2015',
      year_end: 'abc',
      title_de: 'x',
    }),
    { year_end: 'yearEndInvalid' },
  )
  assert.deepEqual(
    validateVitaForm({
      ...empty,
      year: '2015',
      title_de: 'x'.repeat(201),
      place: 'p'.repeat(201),
    }),
    {
      title_de: 'tooLong',
      place: 'tooLong',
    },
  )
  const ok = {
    ...empty,
    year: '2014',
    year_end: '2016',
    title_de: ' Parallel Vienna ',
    place: 'Wien',
  }
  assert.deepEqual(validateVitaForm(ok), {})
  assert.deepEqual(toVitaPayload(ok), {
    year: 2014,
    year_end: 2016,
    category: 'messe',
    title_de: 'Parallel Vienna',
    place: 'Wien',
    is_published: true,
  })
  const row = {
    year: 2003,
    year_end: null,
    category: 'ausbildung' as const,
    title_de: 'Studium',
    place: null,
    is_published: false,
  }
  assert.deepEqual(toVitaPayload(vitaFormFromRow(row)), row)
})

test('sortVita: neueste zuerst, gleiches Jahr nach Position', () => {
  const sorted = sortVita([
    { id: 'a', year: 2010, sort_order: 2 },
    { id: 'b', year: 2019, sort_order: 5 },
    { id: 'c', year: 2010, sort_order: 1 },
  ])
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['b', 'c', 'a'],
  )
})

import { normalizeLinkUrl } from './linkUrl.ts'

test('normalizeLinkUrl ergänzt Schema und lehnt Unbrauchbares ab', () => {
  assert.equal(
    normalizeLinkUrl('https://example.com/a'),
    'https://example.com/a',
  )
  assert.equal(normalizeLinkUrl('http://example.com'), 'http://example.com')
  assert.equal(
    normalizeLinkUrl('  example.com/seite '),
    'https://example.com/seite',
  )
  assert.equal(normalizeLinkUrl('www.example.com'), 'https://www.example.com')
  assert.equal(
    normalizeLinkUrl('stephan.bentzel@viqua.de'),
    'mailto:stephan.bentzel@viqua.de',
  )
  assert.equal(normalizeLinkUrl('mailto:a@b.de'), 'mailto:a@b.de')
  assert.equal(normalizeLinkUrl('tel:+49123'), 'tel:+49123')
  assert.equal(normalizeLinkUrl('javascript:alert(1)'), null)
  assert.equal(normalizeLinkUrl('data:text/html,x'), null)
  assert.equal(normalizeLinkUrl('kein link'), null)
  assert.equal(normalizeLinkUrl(''), null)
})

test('trimTrailingEmpty entfernt leere Absätze am Ende, aber keine im Text', () => {
  assert.equal(trimTrailingEmpty('<p>Text</p><p></p>'), '<p>Text</p>')
  assert.equal(
    trimTrailingEmpty('<p>Text</p><p><br></p><p></p>'),
    '<p>Text</p>',
  )
  assert.equal(
    trimTrailingEmpty('<p>A</p><p></p><p>B</p>'),
    '<p>A</p><p></p><p>B</p>',
  )
  assert.equal(
    trimTrailingEmpty('<p>Text</p><img src="x"><p></p>'),
    '<p>Text</p><img src="x">',
  )
  assert.equal(trimTrailingEmpty('<p></p>'), '')
  assert.equal(trimTrailingEmpty(''), '')
})
