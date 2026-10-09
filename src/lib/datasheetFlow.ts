// Werkblatt erzeugen und herunterladen. Das PDF-Paket wird erst beim Klick geladen.
import type { TFunction } from 'i18next'
import {
  buildDatasheet,
  datasheetFileName,
  type DatasheetInput,
  type DatasheetLabels,
} from './datasheet'
import { formatPriceExact } from './format'

export function datasheetLabels(t: TFunction): DatasheetLabels {
  return {
    untitled: t('artwork.untitled'),
    artist: t('artworkDetail.artist'),
    cycle: t('artworkDetail.cycle'),
    year: t('artworkDetail.year'),
    technique: t('artworkDetail.technique'),
    support: t('artworkDetail.support'),
    dimensions: t('artworkDetail.dimensions'),
    framed: t('artworkDetail.framed'),
    yes: t('artworkDetail.yes'),
    no: t('artworkDetail.no'),
    status: t('artworkDetail.status'),
    price: t('artworkDetail.price'),
    statusNames: {
      verfuegbar: t('artwork.status.verfuegbar'),
      reserviert: t('artwork.status.reserviert'),
      verkauft: t('artwork.status.verkauft'),
    },
    formatDimensions: (height, width, depth) =>
      depth
        ? t('datasheet.dimensionsDepth', { height, width, depth })
        : t('artwork.dimensions', { height, width }),
    formatPrice: (value) =>
      t('artworkDetail.priceInclVat', { price: formatPriceExact(value) }),
  }
}

export async function downloadDatasheet(options: {
  input: DatasheetInput
  slug: string
  imageUrl: string | null
  /** true: interne Vollversion (Dashboard), false: öffentliche Fassung */
  internal: boolean
  t: TFunction
}): Promise<void> {
  const { input, slug, imageUrl, internal, t } = options
  const sheet = buildDatasheet(input, datasheetLabels(t))
  const { createDatasheetPdf, downloadPdf } = await import('./datasheetPdf')
  const bytes = await createDatasheetPdf(sheet, {
    imageUrl,
    heading: t(internal ? 'datasheet.headingInternal' : 'datasheet.heading'),
    siteName: t('brand.name'),
    footerLines: [
      `${t('footer.street')}, ${t('footer.city')}`,
      `${t('footer.email')} · ${t('footer.phone')}`,
    ],
  })
  downloadPdf(bytes, datasheetFileName(slug))
}
