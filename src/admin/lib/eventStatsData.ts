import { supabase } from '../../lib/supabase'
import type { EventInfo, InquiryRow, StatRow } from './eventStats'
import { UploadError } from './uploadError'

export type EventStatsData = {
  stats: StatRow[]
  events: EventInfo[]
  inquiries: InquiryRow[]
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

/** Lädt Zähler, Veranstaltungen und Anfragen zu Veranstaltungen. Die Auswahl des Zeitraums folgt im Browser. */
export async function loadEventStats(): Promise<EventStatsData> {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  const [stats, events, inquiries] = await Promise.all([
    supabase
      .from('event_stats')
      .select('event_id, day, views, detail_opens, inquiry_clicks, inquiries'),
    supabase.from('events').select('id, title_de, starts_at, status'),
    supabase
      .from('inquiries')
      .select('event_id, created_at')
      .not('event_id', 'is', null),
  ])
  for (const result of [stats, events, inquiries])
    if (result.error) fail(result.error.message, result.error)
  return {
    stats: (stats.data ?? []) as StatRow[],
    events: (events.data ?? []) as EventInfo[],
    inquiries: (inquiries.data ?? []) as InquiryRow[],
  }
}
