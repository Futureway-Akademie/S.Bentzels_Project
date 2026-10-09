import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import ArtworkCard from '../components/ArtworkCard'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { useGalleryVisibility } from '../config/gallerySettings'
import ContentGate from '../components/ContentGate'
import type { Artwork } from '../data'
import { loadArtworks } from '../lib/content'
import { useLoad } from '../lib/useLoad'

type Panel = 'cycle' | 'year' | null

// Reihenfolge bleibt erhalten: Mehrteiler laufen über die volle Breite,
// aufeinanderfolgende Einzelwerke bilden ein Masonry-Raster.
type Segment =
  { type: 'full'; artwork: Artwork } | { type: 'masonry'; items: Artwork[] }

function toSegments(items: Artwork[]): Segment[] {
  const segments: Segment[] = []
  for (const artwork of items) {
    if (artwork.isMultipart) {
      segments.push({ type: 'full', artwork })
      continue
    }
    const last = segments[segments.length - 1]
    if (last && last.type === 'masonry') last.items.push(artwork)
    else segments.push({ type: 'masonry', items: [artwork] })
  }
  return segments
}

const unique = <T,>(values: (T | null)[]): T[] => [
  ...new Set(values.filter((v): v is T => v != null)),
]

function GalleryContent({ artworks }: { artworks: Artwork[] }) {
  const { t } = useTranslation()
  const visible = useGalleryVisibility()
  const [params, setParams] = useSearchParams()
  const [panelOverride, setPanelOverride] = useState<Panel | undefined>(
    undefined,
  )

  const support = params.get('untergrund')
  const cycle = params.get('zyklus')
  const year = params.get('jahr')
  const onlyAvailable = params.get('verfuegbar') === '1'

  const published = artworks
    .filter((a) => a.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  // Filteroptionen entstehen aus den vorhandenen Angaben und fehlen, wenn es keine gibt
  // oder die Angabe global ausgeblendet ist.
  const supports = unique(published.map((a) => a.supportDe))
  const cycles = unique(published.map((a) => a.cycle))
  const years = unique(published.map((a) => a.year)).sort((a, b) => b - a)
  const showYearFilter = visible.year && years.length > 0
  const showAvailability =
    visible.availability && published.some((a) => a.status)

  const filtered = published.filter(
    (a) =>
      (!support || a.supportDe === support) &&
      (!cycle || a.cycle === cycle) &&
      (!year || a.year === Number(year)) &&
      (!onlyAvailable || a.status === 'verfuegbar'),
  )

  const panel: Panel =
    panelOverride !== undefined
      ? panelOverride
      : cycle
        ? 'cycle'
        : year
          ? 'year'
          : null

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const resetAll = () => {
    setParams({}, { replace: true })
    setPanelOverride(null)
  }

  const noFilter = !support && !cycle && !year && !onlyAvailable
  const hasFilters =
    supports.length > 0 ||
    cycles.length > 0 ||
    showYearFilter ||
    showAvailability

  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t('pages.gallery')}</h1>
      <p className="prose-measure mt-10">{t('gallery.intro')}</p>

      {hasFilters && (
        <section className="mt-16" aria-label={t('gallery.filterLabel')}>
          <SectionLabel number={1}>{t('gallery.filterLabel')}</SectionLabel>
          <hr className="rule mt-4" />
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-5">
            <button
              type="button"
              className="filter-link"
              aria-pressed={noFilter}
              onClick={resetAll}
            >
              {t('gallery.all')}
            </button>
            {supports.map((s) => (
              <button
                key={s}
                type="button"
                className="filter-link"
                aria-pressed={support === s}
                onClick={() => update({ untergrund: support === s ? null : s })}
              >
                {s}
              </button>
            ))}
            {cycles.length > 0 && (
              <button
                type="button"
                className="filter-link"
                aria-pressed={panel === 'cycle'}
                aria-expanded={panel === 'cycle'}
                onClick={() =>
                  setPanelOverride(panel === 'cycle' ? null : 'cycle')
                }
              >
                {t('gallery.byCycle')}
              </button>
            )}
            {showYearFilter && (
              <button
                type="button"
                className="filter-link"
                aria-pressed={panel === 'year'}
                aria-expanded={panel === 'year'}
                onClick={() =>
                  setPanelOverride(panel === 'year' ? null : 'year')
                }
              >
                {t('gallery.byYear')}
              </button>
            )}
            {showAvailability && (
              <button
                type="button"
                className="filter-link"
                aria-pressed={onlyAvailable}
                onClick={() =>
                  update({ verfuegbar: onlyAvailable ? null : '1' })
                }
              >
                {t('gallery.onlyAvailable')}
              </button>
            )}
          </div>

          {panel === 'cycle' && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {cycles.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="filter-link"
                  aria-pressed={cycle === c}
                  onClick={() => update({ zyklus: cycle === c ? null : c })}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {panel === 'year' && showYearFilter && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className="filter-link"
                  aria-pressed={year === String(y)}
                  onClick={() =>
                    update({ jahr: year === String(y) ? null : String(y) })
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <p className="label mt-6" role="status" aria-live="polite">
            {t('gallery.count', { count: filtered.length })}
          </p>
        </section>
      )}

      <section className="mt-12 md:mt-16" aria-label={t('pages.gallery')}>
        {filtered.length === 0 && (
          <p className="text-muted">{t('gallery.empty')}</p>
        )}
        <div className="space-y-16 md:space-y-24">
          {toSegments(filtered).map((segment, index) =>
            segment.type === 'full' ? (
              <Reveal key={segment.artwork.id}>
                <ArtworkCard
                  artwork={segment.artwork}
                  priority={index === 0}
                  sizes="100vw"
                />
              </Reveal>
            ) : (
              <div
                key={`m-${index}`}
                className="columns-1 gap-x-10 sm:columns-2 md:gap-x-14 lg:columns-3 xl:columns-4"
              >
                {segment.items.map((artwork) => (
                  <Reveal
                    key={artwork.id}
                    className="mb-14 break-inside-avoid md:mb-20"
                  >
                    <ArtworkCard artwork={artwork} priority={index === 0} />
                  </Reveal>
                ))}
              </div>
            ),
          )}
        </div>
      </section>

      <p className="mt-24 max-w-[28ch] text-[clamp(1.5rem,1rem+2.5vw,2.75rem)] leading-[1.2]">
        {t('gallery.closing')}
      </p>
    </main>
  )
}

export default function Gallery() {
  const { state, reload } = useLoad(loadArtworks)
  return (
    <ContentGate state={state} reload={reload}>
      {(data) => <GalleryContent artworks={data.artworks} />}
    </ContentGate>
  )
}
