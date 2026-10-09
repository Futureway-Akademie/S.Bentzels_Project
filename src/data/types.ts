// Typen spiegeln das geplante Supabase-Datenmodell (camelCase der Spalten).
// Texte mit späterer Übersetzung haben *De und *En (En darf leer sein).

import type { ImageVariant } from '../lib/imageVariants'

export type ArtworkStatus = 'verfuegbar' | 'reserviert' | 'verkauft'

// Bis auf Bild und Kennung sind alle Angaben optional (null = nicht vorhanden).
export type Artwork = {
  id: string
  slug: string
  mainImageUrl: string
  imageWidth: number
  imageHeight: number
  /** Zusätzliche Fassungen des Hauptbilds für srcset (800 und 1600 px), leer bei älteren Werken */
  imageVariants: ImageVariant[]
  /** Vorschaubild (höchstens 800 px), für Raster und Listen */
  thumbUrl: string | null
  altTextDe: string | null
  titleDe: string | null
  titleEn: string | null
  artist: string | null
  cycle: string | null
  year: number | null
  techniqueDe: string | null
  techniqueEn: string | null
  /** Untergrund als Freitext, z. B. Leinwand, Papier, Holz */
  supportDe: string | null
  heightCm: number | null
  widthCm: number | null
  depthCm: number | null
  framed: boolean | null
  isMultipart: boolean
  priceEur: number | null
  status: ArtworkStatus | null
  descriptionDe: string | null
  descriptionEn: string | null
  isHighlight: boolean
  sortOrder: number
  isPublished: boolean
}

export type ArtworkImage = {
  id: string
  artworkId: string
  imageUrl: string
  thumbUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  imageVariants: ImageVariant[]
  sortOrder: number
}

export type PostStatus = 'entwurf' | 'veroeffentlicht'

export type Post = {
  id: string
  slug: string
  titleDe: string | null
  titleEn: string | null
  excerptDe: string | null
  excerptEn: string | null
  /** HTML aus dem Editor, vor der Anzeige mit sanitizeHtml bereinigen */
  contentDe: string | null
  contentEn: string | null
  coverImageUrl: string | null
  coverThumbUrl: string | null
  coverImageWidth: number | null
  coverImageHeight: number | null
  publishedAt: string | null
  status: PostStatus
  sortOrder: number
  isPublished: boolean
}

export type VitaCategory =
  'ausbildung' | 'ausstellung' | 'messe' | 'kuratorisch'

export type VitaEntry = {
  id: string
  year: number
  yearEnd: number | null
  category: VitaCategory
  titleDe: string
  titleEn: string
  place: string | null
  sortOrder: number
  isPublished: boolean
}

/** Adresse (slug) einer im Dashboard verwalteten Kategorie */
export type PressCategory = string
export type PressMediumType = 'zeitung' | 'magazin' | 'onlineportal'
export type PressFileType = 'image' | 'pdf'

// Presseeintrag: Alle Angaben außer Datei bzw. Link sind optional (null = nicht vorhanden).
export type PressItem = {
  id: string
  titleDe: string | null
  titleEn: string | null
  thumbnailUrl: string | null
  thumbnailWidth: number | null
  thumbnailHeight: number | null
  fileUrl: string | null
  fileType: PressFileType | null
  fileWidth: number | null
  fileHeight: number | null
  medium: string | null
  mediumType: PressMediumType | null
  author: string | null
  publishedAt: string | null
  year: number | null
  category: PressCategory | null
  summaryDe: string | null
  descriptionDe: string | null
  externalUrl: string | null
  isHighlight: boolean
  sortOrder: number
  isPublished: boolean
}

// Interessanter Artikel: Nur die URL ist Pflicht.
export type CuratedLink = {
  id: string
  url: string
  titleDe: string | null
  source: string | null
  noteDe: string | null
  thumbnailUrl: string | null
  thumbnailWidth: number | null
  thumbnailHeight: number | null
  sortOrder: number
  isPublished: boolean
}

export type PressCategoryInfo = {
  slug: string
  nameDe: string
  sortOrder: number
}
