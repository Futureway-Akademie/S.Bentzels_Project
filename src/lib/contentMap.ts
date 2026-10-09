// Umwandlung von Datenbankzeilen in die Typen der öffentlichen Seiten (reine Funktionen).
// Fehlende Angaben werden zu null, damit die Seiten nichts Leeres darstellen.
import { parseVariants } from './imageVariants.ts'
import type {
  Artwork,
  ArtworkImage,
  ArtworkStatus,
  CuratedLink,
  Post,
  PressCategoryInfo,
  PressItem,
  VitaCategory,
  VitaEntry,
} from '../data/types'

export type Row = Record<string, unknown>

const str = (v: unknown): string | null =>
  typeof v === 'string' && v !== '' ? v : null
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
    return Number(v)
  return null
}
const bool = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback
const int = (v: unknown, fallback = 0): number => num(v) ?? fallback

/** Ein Werk aus der Sicht artworks_public. Ausgeblendete Angaben kommen bereits leer an. */
export function artworkFromRow(row: Row): Artwork {
  return {
    id: String(row.id),
    slug: String(row.slug),
    mainImageUrl: String(row.main_image_url ?? ''),
    imageWidth: int(row.image_width, 1),
    imageVariants: parseVariants(row.image_variants),
    imageHeight: int(row.image_height, 1),
    thumbUrl: str(row.thumb_url),
    altTextDe: str(row.alt_text_de),
    titleDe: str(row.title_de),
    titleEn: str(row.title_en),
    artist: str(row.artist),
    cycle: str(row.cycle),
    year: num(row.year),
    techniqueDe: str(row.technique_de),
    techniqueEn: str(row.technique_en),
    supportDe: str(row.support_de),
    heightCm: num(row.height_cm),
    widthCm: num(row.width_cm),
    depthCm: num(row.depth_cm),
    framed: typeof row.framed === 'boolean' ? row.framed : null,
    isMultipart: bool(row.is_multipart),
    priceEur: num(row.price_eur),
    status: str(row.status) as ArtworkStatus | null,
    descriptionDe: str(row.description_de),
    descriptionEn: str(row.description_en),
    isHighlight: bool(row.is_highlight),
    sortOrder: int(row.sort_order),
    isPublished: true,
  }
}

export function artworkImageFromRow(row: Row): ArtworkImage {
  return {
    id: String(row.id),
    artworkId: String(row.artwork_id),
    imageUrl: String(row.image_url ?? ''),
    thumbUrl: str(row.thumb_url),
    imageWidth: num(row.image_width),
    imageVariants: parseVariants(row.image_variants),
    imageHeight: num(row.image_height),
    sortOrder: int(row.sort_order),
  }
}

export function vitaFromRow(row: Row): VitaEntry {
  return {
    id: String(row.id),
    year: int(row.year),
    yearEnd: num(row.year_end),
    category: String(row.category) as VitaCategory,
    titleDe: String(row.title_de ?? ''),
    titleEn: String(row.title_en ?? ''),
    place: str(row.place),
    sortOrder: int(row.sort_order),
    isPublished: bool(row.is_published, true),
  }
}

export function postFromRow(row: Row): Post {
  return {
    id: String(row.id),
    slug: String(row.slug),
    titleDe: str(row.title_de),
    titleEn: str(row.title_en),
    excerptDe: str(row.excerpt_de),
    excerptEn: str(row.excerpt_en),
    contentDe: str(row.content_de),
    contentEn: str(row.content_en),
    coverImageUrl: str(row.cover_image_url),
    coverThumbUrl: str(row.cover_thumb_url),
    coverImageWidth: num(row.cover_image_width),
    coverImageHeight: num(row.cover_image_height),
    publishedAt: str(row.published_at),
    status: row.status === 'veroeffentlicht' ? 'veroeffentlicht' : 'entwurf',
    sortOrder: int(row.sort_order),
    isPublished: bool(row.is_published, true),
  }
}

export function pressFromRow(row: Row): PressItem {
  const fileType = str(row.file_type)
  const mediumType = str(row.medium_type)
  return {
    id: String(row.id),
    titleDe: str(row.title_de),
    titleEn: str(row.title_en),
    thumbnailUrl: str(row.thumbnail_url),
    thumbnailWidth: num(row.thumbnail_width),
    thumbnailHeight: num(row.thumbnail_height),
    fileUrl: str(row.file_url),
    fileType: fileType === 'image' || fileType === 'pdf' ? fileType : null,
    fileWidth: num(row.file_width),
    fileHeight: num(row.file_height),
    medium: str(row.medium),
    mediumType:
      mediumType === 'zeitung' ||
      mediumType === 'magazin' ||
      mediumType === 'onlineportal'
        ? mediumType
        : null,
    author: str(row.author),
    publishedAt: str(row.published_at),
    year: num(row.year),
    category: str(row.category),
    summaryDe: str(row.summary_de),
    descriptionDe: str(row.description_de),
    externalUrl: str(row.external_url),
    isHighlight: bool(row.is_highlight),
    sortOrder: int(row.sort_order),
    isPublished: bool(row.is_published, true),
  }
}

export function pressCategoryFromRow(row: Row): PressCategoryInfo {
  return {
    slug: String(row.slug),
    nameDe: String(row.name_de ?? ''),
    sortOrder: int(row.sort_order),
  }
}

export function curatedFromRow(row: Row): CuratedLink {
  return {
    id: String(row.id),
    url: String(row.url),
    titleDe: str(row.title_de),
    source: str(row.source),
    noteDe: str(row.note_de),
    thumbnailUrl: str(row.thumbnail_url),
    thumbnailWidth: num(row.thumbnail_width),
    thumbnailHeight: num(row.thumbnail_height),
    sortOrder: int(row.sort_order),
    isPublished: bool(row.is_published, true),
  }
}
