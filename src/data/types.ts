// Typen spiegeln das geplante Supabase-Datenmodell (camelCase der Spalten).
// Texte mit späterer Übersetzung haben *De und *En (En darf leer sein).

export type ArtworkStatus = 'verfuegbar' | 'reserviert' | 'verkauft'

// Bis auf Bild und Kennung sind alle Angaben optional (null = nicht vorhanden).
export type Artwork = {
  id: string
  slug: string
  mainImageUrl: string
  imageWidth: number
  imageHeight: number
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
  sortOrder: number
}

export type PostStatus = 'entwurf' | 'veroeffentlicht'

export type Post = {
  id: string
  slug: string
  titleDe: string
  titleEn: string
  excerptDe: string
  excerptEn: string
  contentDe: string
  contentEn: string
  coverImageUrl: string
  coverImageWidth: number
  coverImageHeight: number
  publishedAt: string
  status: PostStatus
  sortOrder: number
  isPublished: boolean
}

export type EventItem = {
  id: string
  slug: string
  titleDe: string
  titleEn: string
  descriptionDe: string
  descriptionEn: string
  startsAt: string
  endsAt: string
  locationName: string
  locationAddress: string
  imageUrl: string
  capacity: number
  registrationOpen: boolean
  recapTextDe: string | null
  sortOrder: number
  isPublished: boolean
}

export type EventPhoto = {
  id: string
  eventId: string
  imageUrl: string
  sortOrder: number
}

export type Course = {
  id: string
  titleDe: string
  titleEn: string
  descriptionDe: string
  startsAt: string
  endsAt: string
  location: string
  capacity: number
  priceEur: number
  registrationOpen: boolean
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
