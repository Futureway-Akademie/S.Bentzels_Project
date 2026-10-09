// Der Name wird überall gleich geschrieben: „Stephan Graf Bentzel-Sturmfeder“ (mit Bindestrich).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|json|css|html|md|sql)$/.test(name) ? [path] : []
  })
}

const WRONG = [
  /Bentzel Sturmfeder/i,
  /Bentzel–Sturmfeder/i,
  /Bentzel-Sturmfelder/i,
  /Bentzel-Sturmfeld\b/i,
  /Stephan Bentzel-Sturmfeder/,
  /Stephan Graf Bentzel Sturmfeder/i,
  /Sturmfeder Project\b/,
]

test('Namensschreibweise ist in Quelltext, Texten und Doku einheitlich', () => {
  const targets = [
    'index.html',
    ...files('src'),
    ...files('docs'),
    'supabase/seed.sql',
  ].filter((path) => !path.endsWith('nameGuard.test.ts'))
  const hits = targets.flatMap((path) => {
    const text = readFileSync(path, 'utf8')
    return WRONG.filter((pattern) => pattern.test(text)).map(
      (pattern) => `${path}: ${pattern}`,
    )
  })
  assert.deepEqual(hits, [])
})
