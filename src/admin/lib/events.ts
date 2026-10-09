import { supabase } from '../../lib/supabase'
import type { EventDatePayload, EventPayload, EventStatus } from './eventForm'
import {
  copyFileByUrl,
  removeFilesByUrl,
  removeFolder,
  uploadImage,
  uploadPdf,
  type RemovalResult,
} from './storage'
import { slugify, uniqueSlug } from './slug'
import { UploadError } from './uploadError'

export type EventRecord = EventPayload & {
  id: string
  slug: string
  created_at: string
  updated_at: string
  sort_order: number
  recurrence_rule: string | null
  image_url: string | null
  image_thumb_url: string | null
  image_width: number | null
  image_height: number | null
  pdf_url: string | null
  copied_from: string | null
}

export type EventTypeRecord = {
  id: string
  slug: string
  name_de: string
  sort_order: number
}

export type EventDateRecord = {
  id: string
  event_id: string
  starts_at: string
  ends_at: string | null
  note_de: string | null
  is_cancelled: boolean
}

export type EventPhotoRecord = {
  id: string
  event_id: string
  image_url: string
  thumb_url: string | null
  image_width: number | null
  image_height: number | null
  sort_order: number
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listEvents(): Promise<EventRecord[]> {
  const { data, error } = await client()
    .from('events')
    .select('*')
    .order('starts_at', { ascending: true, nullsFirst: false })
  if (error) fail(error.message, error)
  return (data ?? []) as EventRecord[]
}

export async function listAllEventDates(): Promise<EventDateRecord[]> {
  const { data, error } = await client()
    .from('event_dates')
    .select('*')
    .order('starts_at', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as EventDateRecord[]
}

export async function listEventTypes(): Promise<EventTypeRecord[]> {
  const { data, error } = await client()
    .from('event_types')
    .select('id, slug, name_de, sort_order')
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as EventTypeRecord[]
}

/** Legt eine neue Veranstaltungsart an, die Adresse entsteht aus dem Namen. */
export async function addEventType(
  name: string,
  existing: EventTypeRecord[],
): Promise<EventTypeRecord> {
  const base = slugify(name) || 'art'
  const slug = uniqueSlug(
    base,
    existing.map((type) => type.slug),
  )
  const sort = Math.max(0, ...existing.map((type) => type.sort_order)) + 10
  const { data, error } = await client()
    .from('event_types')
    .insert({ slug, name_de: name.trim(), sort_order: sort })
    .select('id, slug, name_de, sort_order')
    .single()
  if (error) fail(error.message, error)
  return data as EventTypeRecord
}

export async function getEvent(id: string): Promise<EventRecord> {
  const { data, error } = await client()
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  if (error) fail(error.message, error)
  return data as EventRecord
}

export async function listEventDates(
  eventId: string,
): Promise<EventDateRecord[]> {
  const { data, error } = await client()
    .from('event_dates')
    .select('*')
    .eq('event_id', eventId)
    .order('starts_at', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as EventDateRecord[]
}

export type EventInquiryRecord = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  persons: number | null
  message: string | null
  status: string
  payload: { interest?: boolean } | null
}

/** Anfragen, die Besucher zu dieser Veranstaltung gestellt haben (neueste zuerst). */
export async function listEventInquiries(
  eventId: string,
): Promise<EventInquiryRecord[]> {
  const { data, error } = await client()
    .from('inquiries')
    .select(
      'id, created_at, name, email, phone, persons, message, status, payload',
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) fail(error.message, error)
  return (data ?? []) as EventInquiryRecord[]
}

export async function listEventPhotos(
  eventId: string,
): Promise<EventPhotoRecord[]> {
  const { data, error } = await client()
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as EventPhotoRecord[]
}

/** Adresse aus dem Titel, eindeutig. */
async function slugForTitle(
  title: string,
  currentSlug: string,
  id: string,
): Promise<string> {
  const base = slugify(title)
  if (!base) return currentSlug
  const { data, error } = await client()
    .from('events')
    .select('slug')
    .like('slug', `${base}%`)
    .neq('id', id)
  if (error) fail(error.message, error)
  return uniqueSlug(
    base,
    (data ?? []).map((row: { slug: string }) => row.slug),
  )
}

/** Legt eine Veranstaltung nur mit Titel (und optional Datum und Art) an. */
export async function createEvent(input: {
  title: string
  startsAt: string | null
  typeId: string | null
}): Promise<EventRecord> {
  const id = crypto.randomUUID()
  const slug = await slugForTitle(
    input.title,
    `veranstaltung-${id.slice(0, 8)}`,
    id,
  )
  const { data, error } = await client()
    .from('events')
    .insert({
      id,
      slug,
      title_de: input.title.trim(),
      starts_at: input.startsAt,
      type_id: input.typeId,
    })
    .select('*')
    .single()
  if (error) fail(error.message, error)
  return data as EventRecord
}

export async function updateEvent(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client().from('events').update(patch).eq('id', id)
  if (error) fail(error.message, error)
}

export async function setEventStatus(
  id: string,
  status: EventStatus,
): Promise<void> {
  await updateEvent(id, { status })
}

/**
 * Speichert Angaben und weitere Termine. Termine, die im Formular fehlen, werden gelöscht,
 * bekannte aktualisiert, neue angelegt. Liefert die Adresse und die gespeicherten Termine.
 */
export async function saveEvent(
  record: EventRecord,
  payload: EventPayload,
  dates: ({ id: string | null } & EventDatePayload)[],
): Promise<{ slug: string; dates: EventDateRecord[] }> {
  const db = client()
  const slug = await slugForTitle(payload.title_de, record.slug, record.id)
  await updateEvent(record.id, { ...payload, slug })

  const existing = await listEventDates(record.id)
  const keep = new Set(
    dates.map((date) => date.id).filter((id): id is string => id !== null),
  )
  const removed = existing
    .filter((row) => !keep.has(row.id))
    .map((row) => row.id)
  if (removed.length > 0) {
    const { error } = await db.from('event_dates').delete().in('id', removed)
    if (error) fail(error.message, error)
  }
  for (const date of dates) {
    const { id, ...fields } = date
    if (id) {
      const { error } = await db.from('event_dates').update(fields).eq('id', id)
      if (error) fail(error.message, error)
    } else {
      const { error } = await db
        .from('event_dates')
        .insert({ ...fields, event_id: record.id })
      if (error) fail(error.message, error)
    }
  }
  return { slug, dates: await listEventDates(record.id) }
}

export async function replaceEventImage(
  record: EventRecord,
  file: File,
): Promise<EventRecord> {
  const stored = await uploadImage('events', record.id, file)
  const patch = {
    image_url: stored.url,
    image_thumb_url: stored.thumbUrl,
    image_width: stored.width,
    image_height: stored.height,
  }
  try {
    await updateEvent(record.id, patch)
  } catch (error) {
    await removeFilesByUrl([stored.url, stored.thumbUrl])
    throw error
  }
  await removeFilesByUrl([record.image_url, record.image_thumb_url])
  return { ...record, ...patch }
}

export async function removeEventImage(
  record: EventRecord,
): Promise<EventRecord> {
  const patch = {
    image_url: null,
    image_thumb_url: null,
    image_width: null,
    image_height: null,
  }
  await updateEvent(record.id, patch)
  await removeFilesByUrl([record.image_url, record.image_thumb_url])
  return { ...record, ...patch }
}

export async function replaceEventPdf(
  record: EventRecord,
  file: File,
): Promise<EventRecord> {
  const stored = await uploadPdf('events', record.id, file)
  try {
    await updateEvent(record.id, { pdf_url: stored.url })
  } catch (error) {
    await removeFilesByUrl([stored.url])
    throw error
  }
  await removeFilesByUrl([record.pdf_url])
  return { ...record, pdf_url: stored.url }
}

export async function removeEventPdf(
  record: EventRecord,
): Promise<EventRecord> {
  await updateEvent(record.id, { pdf_url: null })
  await removeFilesByUrl([record.pdf_url])
  return { ...record, pdf_url: null }
}

export async function addEventPhoto(
  eventId: string,
  file: File,
  sortOrder: number,
): Promise<EventPhotoRecord> {
  const stored = await uploadImage('events', eventId, file)
  const { data, error } = await client()
    .from('event_photos')
    .insert({
      event_id: eventId,
      image_url: stored.url,
      thumb_url: stored.thumbUrl,
      image_width: stored.width,
      image_height: stored.height,
      sort_order: sortOrder,
    })
    .select('*')
    .single()
  if (error) {
    await removeFilesByUrl([stored.url, stored.thumbUrl])
    fail(error.message, error)
  }
  return data as EventPhotoRecord
}

export async function removeEventPhoto(
  photo: EventPhotoRecord,
): Promise<RemovalResult> {
  const { error } = await client()
    .from('event_photos')
    .delete()
    .eq('id', photo.id)
  if (error) fail(error.message, error)
  return removeFilesByUrl([photo.image_url, photo.thumb_url])
}

/**
 * Dupliziert eine Veranstaltung samt Bildern und PDF. Die Dateien werden kopiert, damit das
 * Löschen einer Kopie nie Dateien des Originals entfernt. Die Kopie hat noch kein Datum, ist nicht
 * veröffentlicht und geplant. Weitere Termine werden nicht übernommen.
 */
export async function duplicateEvent(id: string): Promise<EventRecord> {
  const db = client()
  const original = await getEvent(id)
  const photos = await listEventPhotos(id)
  const newId = crypto.randomUUID()
  const copied: string[] = []

  const copy = async (url: string | null): Promise<string | null> => {
    if (!url) return null
    const next = await copyFileByUrl(url, newId)
    copied.push(next)
    return next
  }

  try {
    const imageUrl = await copy(original.image_url)
    const thumbUrl = await copy(original.image_thumb_url)
    const pdfUrl = await copy(original.pdf_url)

    const {
      id: _id,
      created_at: _created,
      updated_at: _updated,
      slug: _slug,
      ...rest
    } = original
    void [_id, _created, _updated, _slug]
    const title = `${original.title_de} (Kopie)`
    const slug = await slugForTitle(
      title,
      `veranstaltung-${newId.slice(0, 8)}`,
      newId,
    )
    const { data, error } = await db
      .from('events')
      .insert({
        ...rest,
        id: newId,
        slug,
        title_de: title,
        starts_at: null,
        ends_at: null,
        status: 'geplant',
        is_published: false,
        is_featured: false,
        registration_open: false,
        places_available: original.capacity,
        recurrence_rule: null,
        image_url: imageUrl,
        image_thumb_url: thumbUrl,
        pdf_url: pdfUrl,
        copied_from: original.id,
      })
      .select('*')
      .single()
    if (error) fail(error.message, error)

    for (const photo of photos) {
      const photoUrl = await copy(photo.image_url)
      const photoThumb = await copy(photo.thumb_url)
      const result = await db.from('event_photos').insert({
        event_id: newId,
        image_url: photoUrl,
        thumb_url: photoThumb,
        image_width: photo.image_width,
        image_height: photo.image_height,
        sort_order: photo.sort_order,
      })
      if (result.error) fail(result.error.message, result.error)
    }
    return data as EventRecord
  } catch (error) {
    // Nichts Halbes zurücklassen: Zeile (löscht Fotos mit) und kopierte Dateien entfernen
    await db.from('events').delete().eq('id', newId)
    await removeFilesByUrl(copied)
    throw error
  }
}

/** Löscht eine Veranstaltung samt Terminen, Fotos und allen Dateien ihres Ordners. */
export async function deleteEventWithFiles(id: string): Promise<RemovalResult> {
  const { error } = await client().from('events').delete().eq('id', id)
  if (error) fail(error.message, error)
  return removeFolder('events', id)
}
