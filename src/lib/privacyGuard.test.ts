// Schutz vor Rückfällen: keine externen Schriften, keine Tracking- oder Werbewerkzeuge.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const FORBIDDEN =
  /fonts\.googleapis|fonts\.gstatic|use\.typekit|googletagmanager|google-analytics|gtag\(|connect\.facebook|facebook\.net|hotjar|plausible\.io|matomo|piwik|clarity\.ms|doubleclick|cdn\.jsdelivr/i

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|css|html|json)$/.test(name) ? [path] : []
  })
}

test('Quelltext, Stile und index.html enthalten keine fremden Schrift- oder Trackingadressen', () => {
  const targets = ['index.html', ...files('src'), 'public/robots.txt']
  const hits = targets.filter(
    (path) =>
      !path.endsWith('privacyGuard.test.ts') &&
      FORBIDDEN.test(readFileSync(path, 'utf8')),
  )
  assert.deepEqual(hits, [])
})

test('Schriften kommen aus dem Paket (fontsource), nicht aus dem Netz', () => {
  const css = readFileSync('src/styles/index.css', 'utf8')
  assert.equal(/@import\s+['"]@fontsource\//.test(css), true)
  assert.equal(/@import\s+url\(\s*['"]?https?:/.test(css), false)
})

test('Es gibt keine Cookies und keine Tracking-Pakete', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>
  }
  const names = Object.keys(pkg.dependencies).join(' ')
  assert.equal(
    /analytics|gtag|pixel|hotjar|matomo|plausible|sentry/i.test(names),
    false,
  )
  const code = files('src')
    .filter((path) => !path.endsWith('.test.ts'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n')
  assert.equal(/document\.cookie/.test(code), false)
})
