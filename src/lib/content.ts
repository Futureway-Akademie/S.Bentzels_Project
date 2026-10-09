import type {
  Artwork,
  ArtworkImage,
  CuratedLink,
  Post,
  PressCategoryInfo,
  PressItem,
  VitaEntry,
} from '../data/types'
import { legalDocsFromRows, LEGAL_KEYS, type LegalDocs } from './legalDoc'
import {
  artworkFromRow,
  artworkImageFromRow,
  curatedFromRow,
  postFromRow,
  pressCategoryFromRow,
  pressFromRow,
  vitaFromRow,
  type Row,
} from './contentMap'

// Öffentliche Inhalte aus der Datenbank. Der Datenbank-Client wird erst beim ersten Bedarf
// nachgeladen, damit er nicht im Haupt-Bundle steckt. Ohne Zugangsdaten (.env) bleiben alle
// Listen leer. Die Datenbankregeln zeigen Besuchern nur Veröffentlichtes, ausgeschaltete Angaben
// der Galerie sind in der Sicht artworks_public bereits leer.

async function client() {
  const { supabase } = await import('./supabase')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

// Je Besuch wird jede Liste nur einmal geladen. Schlägt das Laden fehl, wird beim nächsten Mal neu versucht.
const cache = new Map<string, Promise<unknown>>()
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit) return hit as Promise<T>
  const next = load().catch((error: unknown) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, next)
  return next
}

/** Nur für Tests und nach Änderungen im Dashboard: verwirft alle geladenen Listen. */
export function clearContentCache(): void {
  cache.clear()
}

export type ArtworkContent = { artworks: Artwork[]; images: ArtworkImage[] }

export const loadArtworks = (): Promise<ArtworkContent> =>
  once('artworks', async () => {
    const db = await client()
    if (!db) return { artworks: [], images: [] }
    const [artworks, images] = await Promise.all([
      db
        .from('artworks_public')
        .select('*')
        .order('sort_order', { ascending: true }),
      db
        .from('artwork_images')
        .select('*')
        .order('sort_order', { ascending: true }),
    ])
    for (const result of [artworks, images])
      if (result.error) fail(result.error.message, result.error)
    return {
      artworks: ((artworks.data ?? []) as Row[]).map(artworkFromRow),
      images: ((images.data ?? []) as Row[]).map(artworkImageFromRow),
    }
  })

export const loadVita = (): Promise<VitaEntry[]> =>
  once('vita', async () => {
    const db = await client()
    if (!db) return []
    const { data, error } = await db
      .from('vita_entries')
      .select('*')
      .order('year', { ascending: false })
      .order('sort_order', { ascending: true })
    if (error) fail(error.message, error)
    return ((data ?? []) as Row[]).map(vitaFromRow)
  })

export const loadPosts = (): Promise<Post[]> =>
  once('posts', async () => {
    const db = await client()
    if (!db) return []
    const { data, error } = await db
      .from('posts')
      .select('*')
      .eq('status', 'veroeffentlicht')
      .order('published_at', { ascending: false })
    if (error) fail(error.message, error)
    const now = Date.now()
    return ((data ?? []) as Row[])
      .map(postFromRow)
      .filter(
        (post) =>
          !post.publishedAt || new Date(post.publishedAt).getTime() <= now,
      )
  })

export type PressContent = {
  items: PressItem[]
  categories: PressCategoryInfo[]
}

export const loadPress = (): Promise<PressContent> =>
  once('press', async () => {
    const db = await client()
    if (!db) return { items: [], categories: [] }
    const [items, categories] = await Promise.all([
      db
        .from('press_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true }),
      db
        .from('press_categories')
        .select('slug, name_de, sort_order')
        .order('sort_order', { ascending: true }),
    ])
    for (const result of [items, categories])
      if (result.error) fail(result.error.message, result.error)
    return {
      items: ((items.data ?? []) as Row[]).map(pressFromRow),
      categories: ((categories.data ?? []) as Row[]).map(pressCategoryFromRow),
    }
  })

export const loadCurated = (): Promise<CuratedLink[]> =>
  once('curated', async () => {
    const db = await client()
    if (!db) return []
    const { data, error } = await db
      .from('curated_links')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    if (error) fail(error.message, error)
    return ((data ?? []) as Row[]).map(curatedFromRow)
  })

export const loadLegal = (): Promise<LegalDocs> =>
  once('legal', async () => {
    const db = await client()
    if (!db) return { imprint: '', privacy: '' }
    const { data, error } = await db
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(LEGAL_KEYS))
    if (error) fail(error.message, error)
    return legalDocsFromRows((data ?? []) as { key: string; value: unknown }[])
  })
