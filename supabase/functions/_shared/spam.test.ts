import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  checkSpam,
  isRateLimited,
  MIN_FILL_MS,
  nextRateState,
  RATE_LIMIT,
  RATE_WINDOW_MS,
  senderKey,
} from './spam.ts'

const NOW = 1_000_000_000_000

test('Köderfeld: ausgefüllt ist Spam, leer oder fehlend nicht', () => {
  assert.equal(
    checkSpam({ website: 'http://spam', startedAt: NOW - 60_000 }, NOW),
    'honeypot',
  )
  assert.equal(
    checkSpam({ website: '   ', startedAt: NOW - 60_000 }, NOW),
    'ok',
  )
  assert.equal(checkSpam({ startedAt: NOW - 60_000 }, NOW), 'ok')
})

test('Mindestausfüllzeit von 3 Sekunden', () => {
  assert.equal(
    checkSpam({ startedAt: NOW - (MIN_FILL_MS - 1) }, NOW),
    'too_fast',
  )
  assert.equal(checkSpam({ startedAt: NOW - MIN_FILL_MS }, NOW), 'ok')
  assert.equal(checkSpam({ startedAt: NOW - 120_000 }, NOW), 'ok')
})

test('Unmögliche Zeitstempel', () => {
  assert.equal(checkSpam({ startedAt: NOW + 5_000 }, NOW), 'bad_time')
  assert.equal(
    checkSpam({ startedAt: NOW - 25 * 60 * 60 * 1000 }, NOW),
    'bad_time',
  )
})

test('Begrenzung: erst die Anfrage über dem Limit wird abgelehnt, nach dem Fenster beginnt neu', () => {
  let state = nextRateState(null, NOW)
  assert.deepEqual(state, { count: 1, windowStart: NOW })
  for (let i = 2; i <= RATE_LIMIT; i += 1) {
    state = nextRateState(state, NOW + i)
    assert.equal(isRateLimited(state), false, `Anfrage ${i}`)
  }
  state = nextRateState(state, NOW + 100)
  assert.equal(isRateLimited(state), true)
  const fresh = nextRateState(state, NOW + RATE_WINDOW_MS + 1)
  assert.deepEqual(fresh, { count: 1, windowStart: NOW + RATE_WINDOW_MS + 1 })
  assert.equal(isRateLimited(fresh), false)
})

test('Absenderschlüssel ist anonym, stabil und vom Salz abhängig', async () => {
  const a = await senderKey('203.0.113.7', 'salz')
  assert.equal(a, await senderKey('203.0.113.7', 'salz'))
  assert.notEqual(a, await senderKey('203.0.113.8', 'salz'))
  assert.notEqual(a, await senderKey('203.0.113.7', 'anderes'))
  assert.match(a, /^[0-9a-f]{64}$/)
  assert.equal(a.includes('203'), false)
})
