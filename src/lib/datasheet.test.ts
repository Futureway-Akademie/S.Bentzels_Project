import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildDatasheet,
  datasheetFileName,
  wrapText,
  type DatasheetInput,
  type DatasheetLabels,
} from './datasheet.ts'

const labels: DatasheetLabels = {
  untitled: 'Kunstwerk',
  artist: 'Künstler',
  cycle: 'Zyklus',
  year: 'Jahr',
  technique: 'Technik',
  support: 'Untergrund',
  dimensions: 'Maße',
  framed: 'Gerahmt',
  yes: 'ja',
  no: 'nein',
  status: 'Status',
  price: 'Preis',
  statusNames: {
    verfuegbar: 'verfügbar',
    reserviert: 'reserviert',
    verkauft: 'verkauft',
  },
  formatDimensions: (h, w, d) => `${h} × ${w}${d ? ` × ${d}` : ''} cm`,
  formatPrice: (v) => `${v} € inkl. MwSt.`,
}
const empty: DatasheetInput = {
  title: null,
  artist: null,
  cycle: null,
  year: null,
  technique: null,
  support: null,
  heightCm: null,
  widthCm: null,
  depthCm: null,
  framed: null,
  status: null,
  priceEur: null,
  description: null,
}

test('Alle Angaben werden zu Zeilen, in fester Reihenfolge', () => {
  const sheet = buildDatasheet(
    {
      title: 'Gössweinstein',
      artist: 'Stephan Graf Bentzel-Sturmfeder',
      cycle: 'Orte',
      year: 2013,
      technique: 'Triptychon',
      support: 'Leinwand',
      heightCm: 100,
      widthCm: 240,
      depthCm: 4,
      framed: false,
      status: 'verfuegbar',
      priceEur: 6230,
      description: 'Ein Text.',
    },
    labels,
  )
  assert.equal(sheet.title, 'Gössweinstein')
  assert.deepEqual(
    sheet.rows.map(([l]) => l),
    [
      'Künstler',
      'Zyklus',
      'Jahr',
      'Technik',
      'Untergrund',
      'Maße',
      'Gerahmt',
      'Status',
      'Preis',
    ],
  )
  assert.deepEqual(sheet.rows[5], ['Maße', '100 × 240 × 4 cm'])
  assert.deepEqual(sheet.rows[6], ['Gerahmt', 'nein'])
  assert.deepEqual(sheet.rows[8], ['Preis', '6230 € inkl. MwSt.'])
  assert.equal(sheet.description, 'Ein Text.')
})

test('Fehlende Angaben erzeugen keine Zeilen, ohne Titel steht der Ersatztitel', () => {
  const sheet = buildDatasheet(empty, labels)
  assert.deepEqual(sheet, { title: 'Kunstwerk', rows: [], description: null })
  const partial = buildDatasheet(
    {
      ...empty,
      title: '  ',
      artist: '   ',
      year: 0,
      heightCm: 50,
      description: ' \n ',
    },
    labels,
  )
  assert.equal(partial.title, 'Kunstwerk')
  assert.deepEqual(partial.rows, [['Jahr', '0']])
  assert.equal(partial.description, null)
})

test('Maße nur mit Höhe und Breite, Preis 0 ist eine Angabe', () => {
  assert.equal(
    buildDatasheet({ ...empty, heightCm: 10 }, labels).rows.length,
    0,
  )
  assert.equal(buildDatasheet({ ...empty, widthCm: 10 }, labels).rows.length, 0)
  assert.deepEqual(buildDatasheet({ ...empty, priceEur: 0 }, labels).rows, [
    ['Preis', '0 € inkl. MwSt.'],
  ])
})

test('Textumbruch: Breite, Absätze, überlange Wörter', () => {
  const measure = (s: string) => s.length
  assert.deepEqual(wrapText('eins zwei drei vier', 9, measure), [
    'eins zwei',
    'drei vier',
  ])
  assert.deepEqual(wrapText('a b\n\nc d', 10, measure), ['a b', '', 'c d'])
  assert.deepEqual(wrapText('Donaudampfschifffahrt ok', 5, measure), [
    'Donaudampfschifffahrt',
    'ok',
  ])
  assert.deepEqual(wrapText('', 10, measure), [''])
})

test('Dateiname', () => {
  assert.equal(
    datasheetFileName('goessweinstein'),
    'werkblatt-goessweinstein.pdf',
  )
  assert.equal(datasheetFileName('Ä Ü/x'), 'werkblatt-x.pdf')
  assert.equal(datasheetFileName(null), 'werkblatt-werk.pdf')
})
