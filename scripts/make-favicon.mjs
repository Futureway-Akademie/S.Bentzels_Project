// Erzeugt public/favicon.svg: „SB“ in Jost Medium als Pfade (aus der Schriftdatei des Pakets
// @fontsource/jost gelesen), damit das Favicon ohne geladene Schrift überall gleich aussieht.
// Aufruf: node scripts/make-favicon.mjs
import { writeFileSync } from 'node:fs'
import { pathFor } from './favicon-glyphs.mjs'

const scale = 0.042
const s0 = pathFor('S', 0, scale, 0)
const b0 = pathFor('B', 0, scale, 0)
const gap = 0.012 * 1000 * scale
const total = s0.adv + gap + b0.adv
const x0 = (64 - total) / 2
const base = 32 + (0.7 * 1000 * scale) / 2
const s = pathFor('S', x0, scale, base)
const b = pathFor('B', x0 + s0.adv + gap, scale, base)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#141414"/><path fill="#f7f6f2" d="${s.d}${b.d}"/></svg>\n`
writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg)
console.log('public/favicon.svg geschrieben')
