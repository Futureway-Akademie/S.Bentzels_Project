import { supabase } from '../../lib/supabase'
import type {
  ArtworkInfo,
  ArtworkInquiryRow,
  ArtworkStatRow,
} from './artworkStats'
import { UploadError } from './uploadError'

export type ArtworkStatsData = {
  stats: ArtworkStatRow[]
  artworks: ArtworkInfo[]
  inquiries: ArtworkInquiryRow[]
}

function fail(message: string, cause: unknown): never {
  throw new Error(message, { cause })
}

/** Lädt Zähler, Werke und Anfragen zu Werken. Der Zeitraum wird im Browser ausgewählt. */
export async function loadArtworkStats(): Promise<ArtworkStatsData> {
  if (!supabase)
    throw new UploadError('config', 'Supabase ist nicht eingerichtet')
  const [stats, artworks, inquiries] = await Promise.all([
    supabase
      .from('artwork_stats')
      .select('artwork_id, day, views, clicks, lightbox_opens, inquiries'),
    supabase
      .from('artworks')
      .select('id, title_de, main_image_url, thumb_url')
      .is('archived_at', null),
    supabase
      .from('inquiries')
      .select('artwork_id, created_at')
      .not('artwork_id', 'is', null),
  ])
  for (const result of [stats, artworks, inquiries])
    if (result.error) fail(result.error.message, result.error)
  return {
    stats: (stats.data ?? []) as ArtworkStatRow[],
    artworks: (artworks.data ?? []) as ArtworkInfo[],
    inquiries: (inquiries.data ?? []) as ArtworkInquiryRow[],
  }
}
