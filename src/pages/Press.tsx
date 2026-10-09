import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import PressCard from '../components/PressCard'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import ContentGate from '../components/ContentGate'
import type { PressItem } from '../data'
import { loadPress, type PressContent } from '../lib/content'
import { pressYear } from '../lib/press'
import { useLoad } from '../lib/useLoad'

function PressContentPage({
  items: pressItems,
  categories: allCategories,
}: PressContent) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [yearPanel, setYearPanel] = useState(false)
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  const category = params.get('kategorie')
  const year = params.get('jahr')

  const published = pressItems
    .filter((p) => p.isPublished)
    .sort(
      (a, b) =>
        Number(b.isHighlight) - Number(a.isHighlight) ||
        a.sortOrder - b.sortOrder,
    )

  // Filteroptionen nur aus vorhandenen Angaben
  const categories = allCategories.filter((c) =>
    published.some((p) => p.category === c.slug),
  )
  const years = [
    ...new Set(published.map(pressYear).filter((y): y is number => y != null)),
  ].sort((a, b) => b - a)

  const filtered = published.filter(
    (p) =>
      (!category || p.category === category) &&
      (!year || pressYear(p) === Number(year)),
  )
  const featured = filtered.filter((p) => p.isHighlight)
  const rest = filtered.filter((p) => !p.isHighlight)

  const imageItems: PressItem[] = filtered.filter(
    (p) => p.fileType === 'image' && p.fileUrl,
  )
  const lightboxIndex = imageItems.findIndex((p) => p.id === lightboxId)
  const lightboxImages = imageItems.map((p) => ({
    src: p.fileUrl as string,
    alt: p.titleDe ?? t('press.documentAlt'),
    width: p.fileWidth ?? 1600,
    height: p.fileHeight ?? 1067,
  }))

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const categoryName = (item: PressItem) =>
    allCategories.find((c) => c.slug === item.category)?.nameDe ?? null

  const hasFilters = categories.length > 0 || years.length > 0
  const noFilter = !category && !year
  const showYears = yearPanel || !!year

  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t('pages.pressArchive')}</h1>
      <p className="prose-measure mt-10">{t('press.intro')}</p>

      {hasFilters && (
        <section className="mt-16" aria-label={t('press.filterLabel')}>
          <div className="flex flex-wrap gap-x-8 gap-y-5">
            <button
              type="button"
              className="filter-link"
              aria-pressed={noFilter}
              onClick={() => {
                setParams({}, { replace: true })
                setYearPanel(false)
              }}
            >
              {t('press.all')}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="filter-link"
                aria-pressed={category === c.slug}
                onClick={() =>
                  update({ kategorie: category === c.slug ? null : c.slug })
                }
              >
                {c.nameDe}
              </button>
            ))}
            {years.length > 0 && (
              <button
                type="button"
                className="filter-link"
                aria-pressed={showYears}
                aria-expanded={showYears}
                onClick={() => setYearPanel(!showYears)}
              >
                {t('press.byYear')}
              </button>
            )}
          </div>
          {showYears && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-5">
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
            {t('press.count', { count: filtered.length })}
          </p>
        </section>
      )}

      {filtered.length === 0 && (
        <p className="mt-12 text-muted">{t('press.empty')}</p>
      )}

      {featured.length > 0 && (
        <section className="mt-16" aria-labelledby="press-featured">
          <SectionLabel number={1}>{t('press.highlights')}</SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="press-featured" className="sr-only">
            {t('press.highlights')}
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-16 md:grid-cols-2">
            {featured.map((item) => (
              <Reveal key={item.id}>
                <PressCard
                  item={item}
                  featured
                  categoryName={categoryName(item)}
                  onOpenImage={setLightboxId}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-20 md:mt-28" aria-labelledby="press-archive">
          <SectionLabel number={featured.length > 0 ? 2 : 1}>
            {t('press.archive')}
          </SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="press-archive" className="sr-only">
            {t('press.archive')}
          </h2>
          <div className="mt-10 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
            {rest.map((item) => (
              <Reveal key={item.id} className="mb-14 break-inside-avoid">
                <PressCard
                  item={item}
                  categoryName={categoryName(item)}
                  onOpenImage={setLightboxId}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {lightboxIndex >= 0 && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onIndexChange={(i) => setLightboxId(imageItems[i].id)}
          onClose={() => setLightboxId(null)}
        />
      )}
    </main>
  )
}

export default function Press() {
  const { state, reload } = useLoad(loadPress)
  return (
    <ContentGate state={state} reload={reload}>
      {(data) => <PressContentPage {...data} />}
    </ContentGate>
  )
}
