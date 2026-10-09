import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
const buf = readFileSync(
  new URL(
    '../node_modules/@fontsource/jost/files/jost-latin-500-normal.woff',
    import.meta.url,
  ),
)
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
const n = dv.getUint16(12)
const tables = {}
for (let i = 0; i < n; i++) {
  const o = 44 + i * 20
  const tag = String.fromCharCode(...buf.subarray(o, o + 4))
  const off = dv.getUint32(o + 4),
    comp = dv.getUint32(o + 8),
    orig = dv.getUint32(o + 12)
  const raw = buf.subarray(off, off + comp)
  const data = comp < orig ? inflateSync(raw) : raw
  tables[tag] = new DataView(data.buffer, data.byteOffset, data.byteLength)
}
const head = tables.head,
  upm = head.getUint16(18),
  locFmt = head.getInt16(50)
const cmap = tables.cmap
let glyphOf = null
const nt = cmap.getUint16(2)
for (let i = 0; i < nt; i++) {
  const pid = cmap.getUint16(4 + i * 8),
    eid = cmap.getUint16(6 + i * 8),
    off = cmap.getUint32(8 + i * 8)
  const fmt = cmap.getUint16(off)
  if (fmt === 4 && pid === 3 && eid === 1 && !glyphOf) {
    const segX2 = cmap.getUint16(off + 6)
    const endO = off + 14,
      startO = endO + segX2 + 2,
      deltaO = startO + segX2,
      rangeO = deltaO + segX2
    glyphOf = (c) => {
      for (let s = 0; s < segX2 / 2; s++) {
        const end = cmap.getUint16(endO + s * 2),
          start = cmap.getUint16(startO + s * 2)
        if (c >= start && c <= end) {
          const delta = cmap.getInt16(deltaO + s * 2),
            ro = cmap.getUint16(rangeO + s * 2)
          if (ro === 0) return (c + delta) & 0xffff
          const g = cmap.getUint16(rangeO + s * 2 + ro + (c - start) * 2)
          return g === 0 ? 0 : (g + delta) & 0xffff
        }
      }
      return 0
    }
  }
}
const hhea = tables.hhea,
  nHM = hhea.getUint16(34),
  hmtx = tables.hmtx
const advance = (g) => hmtx.getUint16(Math.min(g, nHM - 1) * 4)
const loca = tables.loca,
  glyf = tables.glyf
const gOff = (g) => (locFmt ? loca.getUint32(g * 4) : loca.getUint16(g * 2) * 2)
function outline(g) {
  const a = gOff(g),
    b = gOff(g + 1)
  if (a === b) return []
  let p = a
  const nc = glyf.getInt16(p)
  p += 10
  if (nc < 0) throw new Error('composite')
  const ends = []
  for (let i = 0; i < nc; i++) {
    ends.push(glyf.getUint16(p))
    p += 2
  }
  const npts = ends[nc - 1] + 1
  const il = glyf.getUint16(p)
  p += 2 + il
  const flags = []
  while (flags.length < npts) {
    const f = glyf.getUint8(p++)
    flags.push(f)
    if (f & 8) {
      let r = glyf.getUint8(p++)
      while (r--) flags.push(f)
    }
  }
  const read = (short, same) => {
    const out = []
    let v = 0
    for (let i = 0; i < npts; i++) {
      const f = flags[i]
      if (f & short) {
        const d = glyf.getUint8(p++)
        v += f & same ? d : -d
      } else if (!(f & same)) {
        v += glyf.getInt16(p)
        p += 2
      }
      out.push(v)
    }
    return out
  }
  const xs = read(2, 16),
    ys = read(4, 32)
  const contours = []
  let s = 0
  for (const e of ends) {
    contours.push(
      Array.from({ length: e - s + 1 }, (_, i) => ({
        x: xs[s + i],
        y: ys[s + i],
        on: !!(flags[s + i] & 1),
      })),
    )
    s = e + 1
  }
  return contours
}
const f = (v) => Math.round(v * 100) / 100
export function pathFor(ch, x0, scale, base) {
  const g = glyphOf(ch.codePointAt(0))
  const X = (x) => f(x0 + x * scale),
    Y = (y) => f(base - y * scale)
  let d = ''
  for (const pts of outline(g)) {
    // Startpunkt auf der Kurve
    let start = pts.findIndex((q) => q.on),
      list = pts
    if (start < 0) {
      const m = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
        on: true,
      }
      list = [m, ...pts.slice(1), pts[0]]
      start = 0
    }
    list = [...list.slice(start), ...list.slice(0, start)]
    d += `M${X(list[0].x)} ${Y(list[0].y)}`
    let i = 1
    const cnt = list.length
    while (i <= cnt) {
      const cur = list[i % cnt]
      if (cur.on) {
        d += `L${X(cur.x)} ${Y(cur.y)}`
        i++
      } else {
        const next = list[(i + 1) % cnt]
        if (next.on) {
          d += `Q${X(cur.x)} ${Y(cur.y)} ${X(next.x)} ${Y(next.y)}`
          i += 2
        } else {
          const mx = (cur.x + next.x) / 2,
            my = (cur.y + next.y) / 2
          d += `Q${X(cur.x)} ${Y(cur.y)} ${X(mx)} ${Y(my)}`
          i++
        }
      }
    }
    d += 'Z'
  }
  return { d, adv: advance(g) * scale, upm }
}
