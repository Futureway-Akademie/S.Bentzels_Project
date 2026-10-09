// Filter und Anzeige der Eingänge (reine Funktionen, ohne Imports).

export const INQUIRY_TYPES = [
  'werk',
  'seminar',
  'vortrag',
  'kunstkurs',
  'bentzel_club',
  'kontakt',
  'veranstaltung',
] as const
export type InquiryType = (typeof INQUIRY_TYPES)[number]

export const INQUIRY_STATUSES = ['neu', 'beantwortet', 'erledigt'] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export type InquiryRow = {
  id: string
  created_at: string
  type: InquiryType
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string | null
  payload: Record<string, unknown> | null
  artwork_id: string | null
  event_id: string | null
  persons: number | null
  status: InquiryStatus
}

export type InquiryFilters = {
  type: '' | InquiryType
  status: '' | InquiryStatus
  /** Suchtext in Name, E-Mail, Unternehmen und Nachricht */
  query: string
}

export const emptyInquiryFilters: InquiryFilters = {
  type: '',
  status: '',
  query: '',
}

export function filterInquiries(
  rows: readonly InquiryRow[],
  filters: InquiryFilters,
): InquiryRow[] {
  const query = filters.query.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.type && row.type !== filters.type) return false
    if (filters.status && row.status !== filters.status) return false
    if (query) {
      const haystack = [
        row.name,
        row.email,
        row.company,
        row.message,
        row.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

/** Zahl der Eingänge je Status. */
export function countByStatus(
  rows: readonly InquiryRow[],
): Record<InquiryStatus, number> {
  const counts: Record<InquiryStatus, number> = {
    neu: 0,
    beantwortet: 0,
    erledigt: 0,
  }
  for (const row of rows) counts[row.status] += 1
  return counts
}

/** Neueste zuerst, bei gleicher Zeit stabil nach Name. */
export function newestFirst(rows: readonly InquiryRow[]): InquiryRow[] {
  return [...rows].sort(
    (a, b) =>
      b.created_at.localeCompare(a.created_at) ||
      a.name.localeCompare(b.name, 'de'),
  )
}

/** Betreff für „Per E-Mail antworten“. Mit Bezug (Werk, Veranstaltung) steht er im Betreff. */
export function replySubject(
  row: InquiryRow,
  subjectOf: string | null,
): string {
  if (subjectOf) return `Re: ${subjectOf}`
  const names: Record<InquiryType, string> = {
    werk: 'Ihre Werkanfrage',
    seminar: 'Ihre Anfrage zu The Art of Becoming',
    vortrag: 'Ihre Vortragsanfrage',
    kunstkurs: 'Ihre Anfrage zum Kunstkurs',
    bentzel_club: 'Ihr Interesse am Kreis',
    kontakt: 'Ihre Nachricht',
    veranstaltung: 'Ihre Anfrage zur Veranstaltung',
  }
  return names[row.type]
}

export function mailtoReply(row: InquiryRow, subject: string): string {
  return `mailto:${row.email}?subject=${encodeURIComponent(subject)}`
}

/** Zusatzangaben der Anfrage als Zeilen (Schlüssel, Wert), leere Werte entfallen. */
export function payloadEntries(
  payload: Record<string, unknown> | null,
): [string, string][] {
  if (!payload) return []
  return Object.entries(payload)
    .filter(
      ([, value]) =>
        value !== null && value !== undefined && String(value).trim() !== '',
    )
    .map(([key, value]) => [
      key,
      typeof value === 'boolean' ? (value ? 'ja' : 'nein') : String(value),
    ])
}
