// Sitemap (reine Funktionen, in Node getestet): alle öffentlichen Seiten, Werke, Beiträge und
// Veranstaltungen. /admin, die Abmeldeseite und das Design-System gehören nicht hinein.

export type SitemapEntry = { path: string; lastmod?: string | null }

export const STATIC_PATHS = [
  '/',
  '/kuenstler',
  '/galerie',
  '/seminare',
  '/seminare/the-art-of-becoming',
  '/seminare/kunstkurse',
  '/seminare/vortraege',
  '/netzwerk',
  '/netzwerk/bentzel-club',
  '/veranstaltungen',
  '/journal',
  '/presse',
  '/presse/interessante-artikel',
  '/kontakt',
  '/impressum',
  '/datenschutz',
]

const xml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const day = (value: string | null | undefined): string | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function detailEntries(
  prefix: string,
  rows: { slug: string | null; updated_at?: string | null }[],
): SitemapEntry[] {
  return rows
    .filter((row): row is { slug: string; updated_at?: string | null } =>
      Boolean(row.slug),
    )
    .map((row) => ({
      path: `${prefix}/${encodeURIComponent(row.slug)}`,
      lastmod: row.updated_at ?? null,
    }))
}

export function buildSitemap(siteUrl: string, entries: SitemapEntry[]): string {
  const base = siteUrl.replace(/\/+$/, '')
  const seen = new Set<string>()
  const items: string[] = []
  for (const entry of entries) {
    if (seen.has(entry.path)) continue
    seen.add(entry.path)
    const lastmod = day(entry.lastmod)
    items.push(
      `  <url><loc>${xml(base + entry.path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`
}
