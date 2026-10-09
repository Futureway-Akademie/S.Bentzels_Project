import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isBlankHtml,
  LEGAL_KEYS,
  legalDocsFromRows,
  parseLegalHtml,
} from './legalDoc.ts'

test('Gespeicherter Wert wird nur als Text mit html akzeptiert', () => {
  assert.equal(parseLegalHtml({ html: ' <p>Hallo</p> ' }), '<p>Hallo</p>')
  for (const bad of [null, undefined, 5, 'x', {}, { html: 3 }])
    assert.equal(parseLegalHtml(bad), '')
})

test('Beide Rechtstexte aus den Einstellungen, fehlende bleiben leer', () => {
  const docs = legalDocsFromRows([
    { key: LEGAL_KEYS.privacy, value: { html: '<p>D</p>' } },
    { key: 'gallery_visibility', value: { price: true } },
  ])
  assert.deepEqual(docs, { imprint: '', privacy: '<p>D</p>' })
})

test('Leerer Editorinhalt gilt als leer, Bilder und Text nicht', () => {
  assert.equal(isBlankHtml(''), true)
  assert.equal(isBlankHtml('<p></p>'), true)
  assert.equal(isBlankHtml('<p>&nbsp;</p><p> </p>'), true)
  assert.equal(isBlankHtml('<p>Text</p>'), false)
  assert.equal(isBlankHtml('<p><img src="https://x/y.png" alt=""></p>'), false)
})
