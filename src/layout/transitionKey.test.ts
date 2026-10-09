import assert from 'node:assert/strict'
import { test } from 'node:test'
import { transitionKey } from './transitionKey.ts'

test('Seitenübergang: Detailseiten derselben Art teilen den Schlüssel', () => {
  assert.equal(
    transitionKey('/galerie/werk-1'),
    transitionKey('/galerie/werk-2'),
  )
  assert.equal(transitionKey('/galerie/werk-1'), transitionKey('/galerie'))
  assert.equal(transitionKey('/journal/a'), transitionKey('/journal/b'))
  assert.equal(
    transitionKey('/veranstaltungen/a'),
    transitionKey('/veranstaltungen'),
  )
})

test('Seitenübergang: andere Seiten wechseln den Schlüssel', () => {
  assert.notEqual(transitionKey('/galerie'), transitionKey('/journal'))
  assert.notEqual(
    transitionKey('/seminare'),
    transitionKey('/seminare/kunstkurse'),
  )
  assert.equal(transitionKey('/'), '/')
})
