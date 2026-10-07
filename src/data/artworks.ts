import { placeholderImage } from './placeholder'
import type { Artwork } from './types'

type Seed = {
  slug: string
  title: string
  cycle?: string
  year: number
  technique: string
  support: 'leinwand' | 'papier'
  h: number
  w: number
  framed?: boolean
  multipart?: boolean
  price: number
  highlight?: boolean
}

const seeds: Seed[] = [
  {
    slug: 'das-juengste-gericht-nach-michelangelo',
    title: 'Das jüngste Gericht nach Michelangelo',
    year: 2010,
    technique: 'Triptychon',
    support: 'leinwand',
    h: 120,
    w: 300,
    multipart: true,
    price: 7240,
    highlight: true,
  },
  {
    slug: 'goessweinstein',
    title: 'Gössweinstein',
    cycle: 'Pellegrinaggio',
    year: 2013,
    technique: 'Triptychon',
    support: 'leinwand',
    h: 100,
    w: 240,
    multipart: true,
    price: 6230,
    highlight: true,
  },
  {
    slug: 'poppy-picking',
    title: 'Poppy Picking',
    cycle: 'Blood and Opium',
    year: 2016,
    technique: 'Leinwand',
    support: 'leinwand',
    h: 140,
    w: 150,
    price: 3240,
    highlight: true,
  },
  {
    slug: 'flower-i',
    title: 'Flower I',
    year: 2020,
    technique: 'Aquarell auf Papier',
    support: 'papier',
    h: 43,
    w: 53,
    framed: true,
    price: 345,
    highlight: true,
  },
  {
    slug: 'flower-ii',
    title: 'Flower II',
    year: 2020,
    technique: 'Aquarell auf Papier',
    support: 'papier',
    h: 43,
    w: 53,
    framed: true,
    price: 345,
  },
  {
    slug: 'bloody-rider',
    title: 'Bloody Rider',
    year: 2019,
    technique: 'Mixed Media auf Papier',
    support: 'papier',
    h: 36,
    w: 47,
    price: 285,
    highlight: true,
  },
  {
    slug: 'forchheim',
    title: 'Forchheim',
    cycle: 'Intuition',
    year: 2020,
    technique: 'Papier',
    support: 'papier',
    h: 53,
    w: 43,
    framed: true,
    price: 460,
  },
  {
    slug: 'the-swimmer-wiesent',
    title: 'The Swimmer Wiesent',
    year: 2020,
    technique: 'Papier',
    support: 'papier',
    h: 53,
    w: 43,
    price: 320,
  },
]

// Bilder: 20 Pixel pro Zentimeter, daraus ergeben sich die Originalproportionen.
export const artworks: Artwork[] = seeds.map((s, i) => {
  const imageWidth = s.w * 20
  const imageHeight = s.h * 20
  return {
    id: `artwork-${i + 1}`,
    slug: s.slug,
    titleDe: s.title,
    titleEn: '',
    cycle: s.cycle ?? null,
    year: s.year,
    techniqueDe: s.technique,
    techniqueEn: '',
    support: s.support,
    heightCm: s.h,
    widthCm: s.w,
    depthCm: null,
    framed: s.framed ?? false,
    isMultipart: s.multipart ?? false,
    priceEur: s.price,
    showPrice: true,
    status: 'verfuegbar',
    descriptionDe: 'Beschreibung folgt.',
    descriptionEn: '',
    isHighlight: s.highlight ?? false,
    mainImageUrl: placeholderImage(imageWidth, imageHeight),
    imageWidth,
    imageHeight,
    sortOrder: i + 1,
    isPublished: true,
  }
})
