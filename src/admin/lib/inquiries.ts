import { supabase } from '../../lib/supabase'
import type { InquiryRow, InquiryStatus } from './inquiryList'
import { UploadError } from './uploadError'

export type GuestRow = {
  id: string
  created_at: string
  event_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  guests: number
  status: 'angemeldet' | 'warteliste' | 'storniert'
}

export type EventOption = {
  id: string
  title_de: string
  starts_at: string | null
  capacity: number | null
  registration_mode: string | null
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listInquiries(): Promise<InquiryRow[]> {
  const { data, error } = await client()
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) fail(error.message, error)
  return (data ?? []) as InquiryRow[]
}

export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<void> {
  const { error } = await client()
    .from('inquiries')
    .update({ status })
    .eq('id', id)
  if (error) fail(error.message, error)
}

/** Titel von Veranstaltungen und Werken zu ihren Kennungen. Fehlt das Recht (Event-Redakteur), bleiben die Werke leer. */
export async function loadReferenceTitles(): Promise<{
  events: Record<string, string>
  artworks: Record<string, string>
}> {
  const db = client()
  const [events, artworks] = await Promise.all([
    db.from('events').select('id, title_de'),
    db.from('artworks').select('id, title_de'),
  ])
  if (events.error) fail(events.error.message, events.error)
  const map = (rows: { id: string; title_de: string | null }[] | null) =>
    Object.fromEntries((rows ?? []).map((r) => [r.id, r.title_de ?? '']))
  return {
    events: map(
      events.data as { id: string; title_de: string | null }[] | null,
    ),
    artworks: artworks.error
      ? {}
      : map(artworks.data as { id: string; title_de: string | null }[] | null),
  }
}

export async function listGuests(): Promise<GuestRow[]> {
  const { data, error } = await client()
    .from('registrations')
    .select(
      'id, created_at, event_id, name, email, phone, company, guests, status',
    )
    .order('created_at', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as GuestRow[]
}

export async function listGuestlistEvents(): Promise<EventOption[]> {
  const { data, error } = await client()
    .from('events')
    .select('id, title_de, starts_at, capacity, registration_mode')
    .order('starts_at', { ascending: false })
  if (error) fail(error.message, error)
  return (data ?? []) as EventOption[]
}
