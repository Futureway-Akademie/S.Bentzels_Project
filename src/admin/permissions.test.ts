import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canAccess, isAdminRole, modulesFor } from './permissions.ts'

test('Administratoren dürfen alles, Redakteure nur ausdrücklich genannte Module', () => {
  assert.equal(canAccess('admin'), true)
  assert.equal(canAccess('admin', ['event_editor']), true)
  assert.equal(canAccess('event_editor'), false)
  assert.equal(canAccess('event_editor', []), false)
  assert.equal(canAccess('event_editor', ['event_editor']), true)
  assert.equal(canAccess(null, ['event_editor']), false)
  assert.equal(canAccess(null), false)
})

test('Nur bekannte Rollen werden erkannt', () => {
  assert.equal(isAdminRole('admin'), true)
  assert.equal(isAdminRole('event_editor'), true)
  assert.equal(isAdminRole('Admin'), false)
  assert.equal(isAdminRole(undefined), false)
  assert.equal(isAdminRole(null), false)
})

test('Menü je Rolle', () => {
  const modules = [
    { id: 'overview' },
    { id: 'events', roles: ['event_editor'] as const },
    { id: 'stats', roles: ['event_editor'] as const },
    { id: 'artworks' },
  ]
  assert.deepEqual(
    modulesFor(modules, 'admin').map((m) => m.id),
    ['overview', 'events', 'stats', 'artworks'],
  )
  assert.deepEqual(
    modulesFor(modules, 'event_editor').map((m) => m.id),
    ['events', 'stats'],
  )
  assert.deepEqual(modulesFor(modules, null), [])
})
