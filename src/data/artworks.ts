import { placeholderImage } from './placeholder'
import type { Artwork } from './types'

type Seed = Partial<
  Pick<
    Artwork,
    | 'titleDe'
    | 'cycle'
    | 'year'
    | 'techniqueDe'
    | 'supportDe'
    | 'framed'
    | 'priceEur'
    | 'status'
    | 'descriptionDe'
  >
> & {
  slug: string
  /** Höhe und Breite in cm, daraus ergeben sich Maße und Bildproportionen */
  h: number
  w: number
  multipart?: boolean
  highlight?: boolean
  hideDimensions?: boolean
}

const seeds: Seed[] = [
  {
    slug: 'das-juengste-gericht-nach-michelangelo',
    titleDe: 'Das jüngste Gericht nach Michelangelo',
    year: 2010,
    techniqueDe: 'Triptychon',
    supportDe: 'Leinwand',
    h: 120,
    w: 300,
    multipart: true,
    priceEur: 7240,
    highlight: true,
  },
  {
    slug: 'goessweinstein',
    titleDe: 'Gössweinstein',
    cycle: 'Pellegrinaggio',
    year: 2013,
    techniqueDe: 'Triptychon',
    supportDe: 'Leinwand',
    h: 100,
    w: 240,
    multipart: true,
    priceEur: 6230,
    highlight: true,
  },
  {
    slug: 'poppy-picking',
    titleDe: 'Poppy Picking',
    cycle: 'Blood and Opium',
    year: 2016,
    techniqueDe: 'Leinwand',
    supportDe: 'Leinwand',
    h: 140,
    w: 150,
    priceEur: 3240,
    highlight: true,
  },
  {
    slug: 'flower-i',
    titleDe: 'Flower I',
    year: 2020,
    techniqueDe: 'Aquarell auf Papier',
    supportDe: 'Papier',
    framed: true,
    h: 43,
    w: 53,
    priceEur: 345,
    highlight: true,
  },
  {
    slug: 'flower-ii',
    titleDe: 'Flower II',
    year: 2020,
    techniqueDe: 'Aquarell auf Papier',
    supportDe: 'Papier',
    framed: true,
    h: 43,
    w: 53,
    priceEur: 345,
  },
  {
    slug: 'bloody-rider',
    titleDe: 'Bloody Rider',
    year: 2019,
    techniqueDe: 'Mixed Media auf Papier',
    supportDe: 'Papier',
    h: 36,
    w: 47,
    priceEur: 285,
    highlight: true,
  },
  {
    slug: 'forchheim',
    titleDe: 'Forchheim',
    cycle: 'Intuition',
    year: 2020,
    techniqueDe: 'Papier',
    supportDe: 'Papier',
    framed: true,
    h: 53,
    w: 43,
    priceEur: 460,
  },
  {
    slug: 'the-swimmer-wiesent',
    titleDe: 'The Swimmer Wiesent',
    year: 2020,
    techniqueDe: 'Papier',
    supportDe: 'Papier',
    h: 53,
    w: 43,
    priceEur: 320,
  },
  // Beispiele für Werke mit fehlenden Angaben (nur Bild bzw. nur Titel)
  { slug: 'werk-9', h: 80, w: 60, hideDimensions: true },
  {
    slug: 'werk-10',
    titleDe: 'Ohne Titel',
    h: 70,
    w: 70,
    hideDimensions: true,
  },
]

// Bilder: 20 Pixel pro Zentimeter, daraus ergeben sich die Originalproportionen.
export const artworks: Artwork[] = seeds.map((s, i) => {
  const imageWidth = s.w * 20
  const imageHeight = s.h * 20
  return {
    id: `artwork-${i + 1}`,
    slug: s.slug,
    mainImageUrl: placeholderImage(imageWidth, imageHeight),
    imageWidth,
    imageHeight,
    titleDe: s.titleDe ?? null,
    titleEn: null,
    artist: null,
    cycle: s.cycle ?? null,
    year: s.year ?? null,
    techniqueDe: s.techniqueDe ?? null,
    techniqueEn: null,
    supportDe: s.supportDe ?? null,
    heightCm: s.hideDimensions ? null : s.h,
    widthCm: s.hideDimensions ? null : s.w,
    depthCm: null,
    framed: s.framed ?? null,
    isMultipart: s.multipart ?? false,
    priceEur: s.priceEur ?? null,
    status: s.priceEur ? 'verfuegbar' : null,
    descriptionDe: s.descriptionDe ?? null,
    descriptionEn: null,
    isHighlight: s.highlight ?? false,
    sortOrder: i + 1,
    isPublished: true,
  }
})
