// Auswertung der Veranstaltungsstatistik (reine Funktionen, ohne Imports).
// Gezählt werden nur Zähler je Veranstaltung und Tag, keine Personendaten.

export type StatRow = {
  event_id: string
  day: string
  views: number
  detail_opens: number
  inquiry_clicks: number
  inquiries: number
}

export type EventInfo = {
  id: string
  title_de: string
  starts_at: string | null
  status: string
}

export type InquiryRow = { event_id: string | null; created_at: string }

export type EventStatsRow = {
  eventId: string
  title: string
  startsAt: string | null
  status: string
  views: number
  detailOpens: number
  inquiryClicks: number
  /** Tatsächlich eingegangene Anfragen (aus der Tabelle inquiries) */
  inquiries: number
}

export type EventStatsTotals = Omit<
  EventStatsRow,
  'eventId' | 'title' | 'startsAt' | 'status'
>

export type SortKey =
  'interest' | 'title' | 'views' | 'detailOpens' | 'inquiryClicks' | 'inquiries'

export const PERIODS = [7, 30, 90, null] as const
export type Period = (typeof PERIODS)[number]

const pad = (n: number) => String(n).padStart(2, '0')

/** Erster Tag (JJJJ-MM-TT) des Zeitraums der letzten `days` Tage inklusive heute, null = alles. */
export function sinceDay(days: Period, now: Date): string | null {
  if (days === null) return null
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  )
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
}

/** Anfragen zählen ab Beginn dieses Tages in der lokalen Zeit. */
export function sinceIso(days: Period, now: Date): string | null {
  const day = sinceDay(days, now)
  if (day === null) return null
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toISOString()
}

/** Fasst Zähler und Anfragen je Veranstaltung zusammen. Jede Veranstaltung erscheint, auch ohne Aufrufe. */
export function aggregateEventStats(
  stats: StatRow[],
  events: EventInfo[],
  inquiries: InquiryRow[],
  since: { day: string | null; iso: string | null } = { day: null, iso: null },
): { rows: EventStatsRow[]; totals: EventStatsTotals } {
  const rows = new Map<string, EventStatsRow>(
    events.map((event) => [
      event.id,
      {
        eventId: event.id,
        title: event.title_de,
        startsAt: event.starts_at,
        status: event.status,
        views: 0,
        detailOpens: 0,
        inquiryClicks: 0,
        inquiries: 0,
      },
    ]),
  )
  for (const stat of stats) {
    if (since.day !== null && stat.day < since.day) continue
    const row = rows.get(stat.event_id)
    if (!row) continue
    row.views += stat.views
    row.detailOpens += stat.detail_opens
    row.inquiryClicks += stat.inquiry_clicks
  }
  for (const inquiry of inquiries) {
    if (inquiry.event_id === null) continue
    if (since.iso !== null && inquiry.created_at < since.iso) continue
    const row = rows.get(inquiry.event_id)
    if (row) row.inquiries += 1
  }
  const list = [...rows.values()]
  const totals = list.reduce<EventStatsTotals>(
    (sum, row) => ({
      views: sum.views + row.views,
      detailOpens: sum.detailOpens + row.detailOpens,
      inquiryClicks: sum.inquiryClicks + row.inquiryClicks,
      inquiries: sum.inquiries + row.inquiries,
    }),
    { views: 0, detailOpens: 0, inquiryClicks: 0, inquiries: 0 },
  )
  return { rows: list, totals }
}

export const hasActivity = (row: EventStatsRow): boolean =>
  row.views + row.detailOpens + row.inquiryClicks + row.inquiries > 0

/**
 * Sortiert die Zeilen. „Interesse“ ordnet nach Anfragen, dann Klicks auf den Anfrageknopf,
 * Detailaufrufen und Ansichten, bei Gleichstand nach Titel.
 */
export function sortRows(
  rows: EventStatsRow[],
  key: SortKey,
  descending = true,
): EventStatsRow[] {
  const direction = descending ? -1 : 1
  const byTitle = (a: EventStatsRow, b: EventStatsRow) =>
    a.title.localeCompare(b.title, 'de')
  const compare = (a: EventStatsRow, b: EventStatsRow): number => {
    if (key === 'title') return direction * byTitle(a, b)
    if (key === 'interest') {
      return (
        direction *
          (a.inquiries - b.inquiries ||
            a.inquiryClicks - b.inquiryClicks ||
            a.detailOpens - b.detailOpens ||
            a.views - b.views) || byTitle(a, b)
      )
    }
    return direction * (a[key] - b[key]) || byTitle(a, b)
  }
  return [...rows].sort(compare)
}

/** Anteil in Prozent, null ohne Grundlage. */
export function share(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null
}
