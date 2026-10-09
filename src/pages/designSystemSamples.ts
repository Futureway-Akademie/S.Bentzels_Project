import { placeholderImage, type Artwork, type VitaEntry } from '../data'

// Kleine feste Beispiele nur für die Seite „Design-System“ (keine Inhalte der Website).
const sample = (
  index: number,
  width: number,
  height: number,
  extra: Partial<Artwork> = {},
): Artwork => ({
  id: `sample-${index}`,
  slug: `beispiel-${index}`,
  mainImageUrl: placeholderImage(width, height),
  imageWidth: width,
  imageVariants: [],
  imageHeight: height,
  thumbUrl: null,
  altTextDe: null,
  titleDe: `Beispielwerk ${index}`,
  titleEn: null,
  artist: null,
  cycle: null,
  year: 2020 + index,
  techniqueDe: null,
  techniqueEn: null,
  supportDe: null,
  heightCm: Math.round(height / 20),
  widthCm: Math.round(width / 20),
  depthCm: null,
  framed: null,
  isMultipart: false,
  priceEur: null,
  status: null,
  descriptionDe: null,
  descriptionEn: null,
  isHighlight: false,
  sortOrder: index,
  isPublished: true,
  ...extra,
})

export const sampleArtworks: Artwork[] = [
  sample(1, 2400, 800, { isMultipart: true }),
  sample(2, 1200, 1600, { status: 'verkauft' }),
  sample(3, 1400, 1400),
  sample(4, 1800, 1200, {
    titleDe: null,
    year: null,
    heightCm: null,
    widthCm: null,
  }),
]

export const sampleVita: VitaEntry[] = [
  [2019, 'messe', 'Beispielmesse', 'Wien'],
  [2018, 'ausstellung', 'Beispielausstellung', 'München'],
  [2017, 'kuratorisch', 'Beispielkuration', null],
  [2010, 'ausbildung', 'Beispielausbildung', null],
].map(([year, category, titleDe, place], i) => ({
  id: `sample-vita-${i}`,
  year: year as number,
  yearEnd: null,
  category: category as VitaEntry['category'],
  titleDe: titleDe as string,
  titleEn: '',
  place: place as string | null,
  sortOrder: i,
  isPublished: true,
}))
