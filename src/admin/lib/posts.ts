import { supabase } from '../../lib/supabase'
import type { PostPayload, PostStatus } from './postForm'
import {
  removeFilesByUrl,
  removeFolder,
  removeUnusedInFolder,
  uploadImage,
  type RemovalResult,
} from './storage'
import { slugify, uniqueSlug } from './slug'
import { UploadError } from './uploadError'

export type PostListItem = {
  id: string
  slug: string
  title_de: string | null
  status: PostStatus
  published_at: string | null
  created_at: string
  cover_image_url: string | null
  cover_thumb_url: string | null
}

export type PostRecord = PostListItem & {
  excerpt_de: string | null
  content_de: string | null
  cover_image_width: number | null
  cover_image_height: number | null
}

const LIST_COLUMNS =
  'id, slug, title_de, status, published_at, created_at, cover_image_url, cover_thumb_url'

function client() {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  return supabase
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

export async function listPosts(): Promise<PostListItem[]> {
  const { data, error } = await client()
    .from('posts')
    .select(LIST_COLUMNS)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) fail(error.message, error)
  return (data ?? []) as PostListItem[]
}

export async function getPost(id: string): Promise<PostRecord> {
  const { data, error } = await client()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) fail(error.message, error)
  return data as PostRecord
}

/** Legt einen leeren Entwurf an, damit Bilder sofort einem Beitrag zugeordnet werden können. */
export async function createDraft(): Promise<PostListItem> {
  const id = crypto.randomUUID()
  const { data, error } = await client()
    .from('posts')
    .insert({ id, slug: `beitrag-${id.slice(0, 8)}`, status: 'entwurf' })
    .select(LIST_COLUMNS)
    .single()
  if (error) fail(error.message, error)
  return data as PostListItem
}

async function slugForTitle(
  title: string | null,
  currentSlug: string,
  id: string,
): Promise<string> {
  const base = title ? slugify(title) : ''
  if (!base) return currentSlug
  const { data, error } = await client()
    .from('posts')
    .select('slug')
    .like('slug', `${base}%`)
    .neq('id', id)
  if (error) fail(error.message, error)
  return uniqueSlug(
    base,
    (data ?? []).map((row: { slug: string }) => row.slug),
  )
}

export async function updatePost(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client().from('posts').update(patch).eq('id', id)
  if (error) fail(error.message, error)
}

/** Speichert Angaben und Text. Danach werden Bilder entfernt, die im Text nicht mehr vorkommen. */
export async function savePost(
  record: PostRecord,
  payload: PostPayload,
  contentHtml: string | null,
  usedImageUrls: string[],
): Promise<{ slug: string; leftover: number }> {
  const slug = await slugForTitle(payload.title_de, record.slug, record.id)
  await updatePost(record.id, { ...payload, content_de: contentHtml, slug })
  const cleanup = await removeUnusedInFolder('posts', record.id, [
    record.cover_image_url,
    record.cover_thumb_url,
    ...usedImageUrls,
  ]).catch(() => ({ removed: 0, failed: 0 }))
  return { slug, leftover: cleanup.failed }
}

/** Schaltet zwischen Entwurf und veröffentlicht. Beim Veröffentlichen ohne Datum gilt jetzt. */
export async function setPostStatus(
  record: PostListItem,
  status: PostStatus,
): Promise<{ published_at: string | null }> {
  const publishedAt =
    status === 'veroeffentlicht' && !record.published_at
      ? new Date().toISOString()
      : record.published_at
  await updatePost(record.id, { status, published_at: publishedAt })
  return { published_at: publishedAt }
}

export async function replaceCover(
  record: PostRecord,
  file: File,
): Promise<PostRecord> {
  const stored = await uploadImage('posts', record.id, file)
  try {
    await updatePost(record.id, {
      cover_image_url: stored.url,
      cover_thumb_url: stored.thumbUrl,
      cover_image_width: stored.width,
      cover_image_height: stored.height,
    })
  } catch (error) {
    await removeFilesByUrl([stored.url, stored.thumbUrl])
    throw error
  }
  await removeFilesByUrl([record.cover_image_url, record.cover_thumb_url])
  return {
    ...record,
    cover_image_url: stored.url,
    cover_thumb_url: stored.thumbUrl,
    cover_image_width: stored.width,
    cover_image_height: stored.height,
  }
}

export async function removeCover(record: PostRecord): Promise<PostRecord> {
  await updatePost(record.id, {
    cover_image_url: null,
    cover_thumb_url: null,
    cover_image_width: null,
    cover_image_height: null,
  })
  await removeFilesByUrl([record.cover_image_url, record.cover_thumb_url])
  return {
    ...record,
    cover_image_url: null,
    cover_thumb_url: null,
    cover_image_width: null,
    cover_image_height: null,
  }
}

/** Lädt ein Bild für den Text hoch (Ordner des Beitrags). */
export async function uploadPostImage(postId: string, file: File) {
  const stored = await uploadImage('posts', postId, file)
  // Bilder im Text brauchen keine Vorschau, die Datei wird gleich wieder entfernt
  await removeFilesByUrl([stored.thumbUrl]).catch(() => undefined)
  return { url: stored.url, width: stored.width, height: stored.height }
}

/** Löscht einen Beitrag samt aller Bilder seines Ordners. */
export async function deletePostWithFiles(id: string): Promise<RemovalResult> {
  const { error } = await client().from('posts').delete().eq('id', id)
  if (error) fail(error.message, error)
  return removeFolder('posts', id)
}
