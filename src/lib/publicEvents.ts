import type { Occurrence, PublicEvent, PublicStatus } from './eventCalendar'
import { trackOnce } from './track'

export type EventType = { id: string; slug: string; nameDe: string }

export type EventPhoto = {
  id: string
  imageUrl: string
  thumbUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
}

export type EventData = {
  events: PublicEvent[]
  occurrences: Occurrence[]
  types: EventType[]
}

type Row = Record<string, unknown>
const str = (v: unknown): string | null =>
  typeof v === 'string' && v !== '' ? v : null
const num = (v: unknown): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'string' && v !== ''
      ? Number(v)
      : null
const bool = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback

export function eventFromRow(row: Row): PublicEvent {
  return {
    id: String(row.id),
    slug: String(row.slug),
    typeId: str(row.type_id),
    category: str(row.category),
    status: (str(row.status) ?? 'geplant') as PublicStatus,
    isFeatured: bool(row.is_featured),
    titleDe: String(row.title_de ?? ''),
    shortDescriptionDe: str(row.short_description_de),
    descriptionDe: str(row.description_de),
    recapTextDe: str(row.recap_text_de),
    startsAt: str(row.starts_at),
    endsAt: str(row.ends_at),
    showTime: bool(row.show_time, true),
    isMultiDay: bool(row.is_multi_day),
    imageUrl: str(row.image_url),
    imageThumbUrl: str(row.image_thumb_url),
    imageWidth: num(row.image_width),
    imageHeight: num(row.image_height),
    registrationOpen: bool(row.registration_open),
    registrationDeadline: str(row.registration_deadline),
    registrationMode:
      row.registration_mode === 'verbindlich' ? 'verbindlich' : 'anfrage',
    audienceDe: str(row.audience_de),
    requirementsDe: str(row.requirements_de),
    materialsDe: str(row.materials_de),
    includedDe: str(row.included_de),
    contactName: str(row.contact_name),
    contactEmail: str(row.contact_email),
    contactPhone: str(row.contact_phone),
    pdfUrl: str(row.pdf_url),
    pdfLabelDe: str(row.pdf_label_de),
    externalUrl: str(row.external_url),
    locationName: str(row.location_name),
    locationAddress: str(row.location_address),
    speakerName: str(row.speaker_name),
    capacity: num(row.capacity),
    placesAvailable: num(row.places_available),
    priceEur: num(row.price_eur),
    priceOnRequest:
      typeof row.price_on_request === 'boolean' ? row.price_on_request : null,
    priceNoteDe: str(row.price_note_de),
  }
}

export function occurrenceFromRow(row: Row): Occurrence {
  return {
    eventId: String(row.event_id),
    slug: String(row.slug),
    titleDe: String(row.title_de ?? ''),
    typeId: str(row.type_id),
    status: (str(row.status) ?? 'geplant') as PublicStatus,
    isFeatured: bool(row.is_featured),
    startsAt: String(row.starts_at),
    endsAt: str(row.ends_at),
    showTime: bool(row.show_time, true),
    isCancelled: bool(row.is_cancelled),
    noteDe: str(row.note_de),
    isFirst: bool(row.is_first, true),
  }
}

// Der Datenbank-Client wird erst beim ersten Bedarf nachgeladen, damit er nicht im Haupt-Bundle steckt.
async function client() {
  const { supabase } = await import('./supabase')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

/** Lädt alle öffentlichen Veranstaltungen, Termine und Arten. */
export async function loadEventData(): Promise<EventData> {
  const supabase = await client()
  if (!supabase) return { events: [], occurrences: [], types: [] }
  const [events, occurrences, types] = await Promise.all([
    supabase.from('events_public').select('*'),
    supabase
      .from('event_occurrences')
      .select('*')
      .order('starts_at', { ascending: true }),
    supabase
      .from('event_types')
      .select('id, slug, name_de')
      .order('sort_order', { ascending: true }),
  ])
  for (const result of [events, occurrences, types])
    if (result.error) fail(result.error.message, result.error)
  return {
    events: ((events.data ?? []) as Row[]).map(eventFromRow),
    occurrences: ((occurrences.data ?? []) as Row[]).map(occurrenceFromRow),
    types: ((types.data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      nameDe: String(row.name_de),
    })),
  }
}

export type EventDetailData = {
  event: PublicEvent | null
  occurrences: Occurrence[]
  photos: EventPhoto[]
  types: EventType[]
}

export async function loadEventDetail(slug: string): Promise<EventDetailData> {
  const supabase = await client()
  if (!supabase) return { event: null, occurrences: [], photos: [], types: [] }
  const found = await supabase
    .from('events_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (found.error) fail(found.error.message, found.error)
  if (!found.data)
    return { event: null, occurrences: [], photos: [], types: [] }
  const event = eventFromRow(found.data as Row)
  const [occurrences, photos, types] = await Promise.all([
    supabase
      .from('event_occurrences')
      .select('*')
      .eq('event_id', event.id)
      .order('starts_at', { ascending: true }),
    supabase
      .from('event_photos')
      .select('id, image_url, thumb_url, image_width, image_height, sort_order')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true }),
    supabase.from('event_types').select('id, slug, name_de'),
  ])
  for (const result of [occurrences, photos, types])
    if (result.error) fail(result.error.message, result.error)
  return {
    event,
    occurrences: ((occurrences.data ?? []) as Row[]).map(occurrenceFromRow),
    photos: ((photos.data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      imageUrl: String(row.image_url),
      thumbUrl: str(row.thumb_url),
      imageWidth: num(row.image_width),
      imageHeight: num(row.image_height),
    })),
    types: ((types.data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      nameDe: String(row.name_de),
    })),
  }
}

export type TrackKind = 'view' | 'detail' | 'inquiry_click' | 'inquiry'

/** Zählt ein Ereignis einer Veranstaltung ohne Personenbezug, je Sitzung einmal (siehe track.ts). */
export function trackEvent(eventId: string, kind: TrackKind): void {
  trackOnce(`evt:${kind}:${eventId}`, (supabase) =>
    supabase.rpc('track_event_event', { p_event: eventId, p_kind: kind }),
  )
}
