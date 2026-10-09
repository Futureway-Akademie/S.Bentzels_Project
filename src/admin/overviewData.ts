import { supabase } from '../lib/supabase'

export type InquiryRow = {
  id: string
  type: string
  name: string
  created_at: string
}

export type EventSummary = {
  id: string
  title_de: string
  starts_at: string
  ends_at: string | null
  location_name: string | null
  capacity: number | null
  registration_open: boolean
  /** Angemeldete Personen inklusive Begleitung */
  registered: number
}

export type Overview = {
  newInquiries: { count: number; latest: InquiryRow[] }
  nextEvent: EventSummary | null
  artworks: { available: number; total: number }
}

function client() {
  if (!supabase) throw new Error('Supabase ist nicht eingerichtet')
  return supabase
}

/** Zahl neuer Eingänge für die Seitenleiste. */
export async function loadNewInquiryCount(): Promise<number> {
  const { count, error } = await client()
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'neu')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function loadOverview(): Promise<Overview> {
  const db = client()
  const nowIso = new Date().toISOString()

  const [inquiries, events, available, total] = await Promise.all([
    db
      .from('inquiries')
      .select('id, type, name, created_at', { count: 'exact' })
      .eq('status', 'neu')
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('events')
      .select(
        'id, title_de, starts_at, ends_at, location_name, capacity, registration_open',
      )
      .not('starts_at', 'is', null)
      .not('status', 'in', '(abgesagt,beendet,archiviert)')
      .or(`ends_at.gte.${nowIso},and(ends_at.is.null,starts_at.gte.${nowIso})`)
      .order('starts_at', { ascending: true })
      .limit(1),
    db
      .from('artworks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'verfuegbar')
      .is('archived_at', null),
    db
      .from('artworks')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null),
  ])

  for (const result of [inquiries, events, available, total]) {
    if (result.error) throw new Error(result.error.message)
  }

  let nextEvent: EventSummary | null = null
  const event = events.data?.[0]
  if (event) {
    const registrations = await db
      .from('registrations')
      .select('guests')
      .eq('event_id', event.id)
      .eq('status', 'angemeldet')
    if (registrations.error) throw new Error(registrations.error.message)
    const registered = (registrations.data ?? []).reduce(
      (sum, row) => sum + 1 + (row.guests ?? 0),
      0,
    )
    nextEvent = { ...event, registered }
  }

  return {
    newInquiries: {
      count: inquiries.count ?? 0,
      latest: (inquiries.data ?? []) as InquiryRow[],
    },
    nextEvent,
    artworks: { available: available.count ?? 0, total: total.count ?? 0 },
  }
}
