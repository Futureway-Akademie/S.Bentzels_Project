import { supabase } from '../../lib/supabase'
import type { VitaCategory, VitaPayload } from './vitaForm'
import { UploadError } from './uploadError'

export type VitaRecord = {
  id: string
  year: number
  year_end: number | null
  category: VitaCategory
  title_de: string
  place: string | null
  sort_order: number
  is_published: boolean
}

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listVita(): Promise<VitaRecord[]> {
  const { data, error } = await client()
    .from('vita_entries')
    .select('*')
    .order('year', { ascending: false })
    .order('sort_order', { ascending: true })
  if (error) fail(error.message, error)
  return (data ?? []) as VitaRecord[]
}

export async function createVita(
  payload: VitaPayload,
  sortOrder: number,
): Promise<VitaRecord> {
  const { data, error } = await client()
    .from('vita_entries')
    .insert({ ...payload, sort_order: sortOrder })
    .select('*')
    .single()
  if (error) fail(error.message, error)
  return data as VitaRecord
}

export async function updateVita(
  id: string,
  patch: Partial<VitaPayload>,
): Promise<void> {
  const { error } = await client()
    .from('vita_entries')
    .update(patch)
    .eq('id', id)
  if (error) fail(error.message, error)
}

export async function deleteVita(id: string): Promise<void> {
  const { error } = await client().from('vita_entries').delete().eq('id', id)
  if (error) fail(error.message, error)
}
