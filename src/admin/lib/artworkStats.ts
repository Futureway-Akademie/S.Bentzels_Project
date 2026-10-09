// Auswertung der Werkstatistik (reine Funktionen, ohne Imports).
// Gezählt werden nur Zähler je Werk und Tag, keine Personendaten.

export type ArtworkStatRow = {
  artwork_id: string
  day: string
  views: number
  clicks: number
  lightbox_opens: number
  inquiries: number
}

export type ArtworkInfo = {
  id: string
  title_de: string | null
  main_image_url: string | null
  thumb_url: string | null
}

export type ArtworkInquiryRow = {
  artwork_id: string | null
  created_at: string
}

export type ArtworkStatsRow = {
  artworkId: string
  title: string | null
  imageUrl: string | null
  views: number
  clicks: number
  lightboxOpens: number
  /** Klicks auf „Werk anfragen“ */
  inquiryClicks: number
  /** Tatsächlich eingegangene Anfragen (aus der Tabelle inquiries) */
  inquiries: number
}

export type ArtworkStatsTotals = Pick<
  ArtworkStatsRow,
  'views' | 'clicks' | 'lightboxOpens' | 'inquiryClicks' | 'inquiries'
>

export type ArtworkSortKey =
  | 'interest'
  | 'views'
  | 'clicks'
  | 'lightboxOpens'
  | 'inquiryClicks'
  | 'inquiries'

/** Fasst Zähler und Anfragen je Werk zusammen. Jedes Werk erscheint, auch ohne Aufrufe. */
export function aggregateArtworkStats(
  stats: ArtworkStatRow[],
  artworks: ArtworkInfo[],
  inquiries: ArtworkInquiryRow[],
  since: { day: string | null; iso: string | null } = { day: null, iso: null },
): { rows: ArtworkStatsRow[]; totals: ArtworkStatsTotals } {
  const rows = new Map<string, ArtworkStatsRow>(
    artworks.map((artwork) => [
      artwork.id,
      {
        artworkId: artwork.id,
        title: artwork.title_de,
        imageUrl: artwork.thumb_url ?? artwork.main_image_url,
        views: 0,
        clicks: 0,
        lightboxOpens: 0,
        inquiryClicks: 0,
        inquiries: 0,
      },
    ]),
  )
  for (const stat of stats) {
    if (since.day !== null && stat.day < since.day) continue
    const row = rows.get(stat.artwork_id)
    if (!row) continue
    row.views += stat.views
    row.clicks += stat.clicks
    row.lightboxOpens += stat.lightbox_opens
    row.inquiryClicks += stat.inquiries
  }
  for (const inquiry of inquiries) {
    if (inquiry.artwork_id === null) continue
    if (since.iso !== null && inquiry.created_at < since.iso) continue
    const row = rows.get(inquiry.artwork_id)
    if (row) row.inquiries += 1
  }
  const list = [...rows.values()]
  const totals = list.reduce<ArtworkStatsTotals>(
    (sum, row) => ({
      views: sum.views + row.views,
      clicks: sum.clicks + row.clicks,
      lightboxOpens: sum.lightboxOpens + row.lightboxOpens,
      inquiryClicks: sum.inquiryClicks + row.inquiryClicks,
      inquiries: sum.inquiries + row.inquiries,
    }),
    { views: 0, clicks: 0, lightboxOpens: 0, inquiryClicks: 0, inquiries: 0 },
  )
  return { rows: list, totals }
}

export const artworkHasActivity = (row: ArtworkStatsRow): boolean =>
  row.views +
    row.clicks +
    row.lightboxOpens +
    row.inquiryClicks +
    row.inquiries >
  0

/**
 * Sortiert die Werke. „Interesse“ ordnet nach Anfragen, Klicks auf „Werk anfragen“, Großansichten,
 * Klicks und Anzeigen, bei Gleichstand nach Titel.
 */
export function sortArtworkRows(
  rows: ArtworkStatsRow[],
  key: ArtworkSortKey,
  descending = true,
): ArtworkStatsRow[] {
  const direction = descending ? -1 : 1
  const byTitle = (a: ArtworkStatsRow, b: ArtworkStatsRow) =>
    (a.title ?? '').localeCompare(b.title ?? '', 'de')
  return [...rows].sort((a, b) => {
    if (key === 'interest')
      return (
        direction *
          (a.inquiries - b.inquiries ||
            a.inquiryClicks - b.inquiryClicks ||
            a.lightboxOpens - b.lightboxOpens ||
            a.clicks - b.clicks ||
            a.views - b.views) || byTitle(a, b)
      )
    return direction * (a[key] - b[key]) || byTitle(a, b)
  })
}

/** Die beliebtesten Werke: höchstens `count`, nur mit Anfragen, Anfrage-Klicks, Großansichten oder Klicks. */
export function topArtworks(
  rows: ArtworkStatsRow[],
  count = 5,
): ArtworkStatsRow[] {
  return sortArtworkRows(rows, 'interest')
    .filter(
      (row) =>
        row.inquiries + row.inquiryClicks + row.lightboxOpens + row.clicks > 0,
    )
    .slice(0, count)
}
