import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { useGalleryVisibility } from '../config/gallerySettings'
import { routes } from '../config/routes'
import { artworks } from '../data'
import { artworkAlt, hasDimensions } from '../lib/artwork'
import { formatPrice } from '../lib/format'
import PagePlaceholder from './PagePlaceholder'

export default function ArtworkDetail() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const navigate = useNavigate()
  const visible = useGalleryVisibility()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const list = artworks
    .filter((a) => a.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const index = list.findIndex((a) => a.slug === slug)
  const artwork = list[index]

  if (!artwork)
    return <PagePlaceholder titleKey="artworkDetail.notFound" notFound />

  const previous = list[(index - 1 + list.length) % list.length]
  const next = list[(index + 1) % list.length]
  const alt = artworkAlt(artwork, t('artwork.untitled'), visible.year)
  const title = artwork.titleDe ?? t('artwork.untitled')

  // Nur vorhandene und freigegebene Angaben.
  const facts: [string, string][] = []
  const add = (label: string, value: string | null | undefined) => {
    if (value) facts.push([label, value])
  }
  add(t('artworkDetail.artist'), artwork.artist)
  add(t('artworkDetail.cycle'), artwork.cycle)
  if (visible.year && artwork.year != null)
    add(t('artworkDetail.year'), String(artwork.year))
  if (visible.technique) add(t('artworkDetail.technique'), artwork.techniqueDe)
  if (visible.technique) add(t('artworkDetail.support'), artwork.supportDe)
  if (visible.dimensions && hasDimensions(artwork)) {
    add(
      t('artworkDetail.dimensions'),
      t('artwork.dimensions', {
        height: artwork.heightCm,
        width: artwork.widthCm,
      }),
    )
  }
  if (artwork.framed != null) {
    add(
      t('artworkDetail.framed'),
      artwork.framed ? t('artworkDetail.yes') : t('artworkDetail.no'),
    )
  }
  if (visible.availability && artwork.status) {
    add(t('artworkDetail.status'), t(`artwork.status.${artwork.status}`))
  }
  if (visible.price && artwork.priceEur != null) {
    add(
      t('artworkDetail.price'),
      t('artworkDetail.priceInclVat', { price: formatPrice(artwork.priceEur) }),
    )
  }
  const description = visible.description ? artwork.descriptionDe : null
  const hasInfo = facts.length > 0 || !!description

  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(
    t('artworkDetail.inquireSubject', { title }),
  )}`

  const lightboxImages = list.map((a) => ({
    src: a.mainImageUrl,
    alt: artworkAlt(a, t('artwork.untitled'), visible.year),
    width: a.imageWidth,
    height: a.imageHeight,
  }))

  return (
    <main className="container-page py-10 md:py-16">
      <p>
        <Link to={routes.gallery} className="btn-link">
          {t('artworkDetail.back')}
        </Link>
      </p>

      {/* Bild zuerst */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t('artworkDetail.enlarge')}
          className="block max-w-full cursor-zoom-in border-0 bg-transparent p-0"
          style={{
            width: `min(100%, calc((100vh - 12rem) * ${artwork.imageWidth / artwork.imageHeight}))`,
          }}
        >
          <img
            src={artwork.mainImageUrl}
            width={artwork.imageWidth}
            height={artwork.imageHeight}
            alt={alt}
            fetchPriority="high"
            className="artwork-img"
          />
        </button>
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        {artwork.titleDe ? (
          <h1 className="text-lg font-normal leading-snug">
            {artwork.titleDe}
          </h1>
        ) : (
          <h1 className="sr-only">{title}</h1>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          {hasInfo && (
            <button
              type="button"
              className="btn-link"
              aria-expanded={infoOpen}
              aria-controls="artwork-info"
              onClick={() => setInfoOpen((o) => !o)}
            >
              {infoOpen ? t('artworkDetail.hideInfo') : t('artworkDetail.info')}
            </button>
          )}
          <a href={mailto} className="btn-link">
            {t('artworkDetail.inquire')}
          </a>
        </div>

        {infoOpen && hasInfo && (
          <div id="artwork-info" className="mt-8">
            {facts.length > 0 && (
              <dl className="m-0">
                {facts.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[8rem_1fr] gap-x-4 border-t border-line py-3"
                  >
                    <dt className="label">{label}</dt>
                    <dd className="m-0">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {description && <p className="prose-measure mt-6">{description}</p>}
            {visible.price && artwork.priceEur != null && (
              <p className="mt-6 text-muted">
                {t('artworkDetail.purchaseNote')}
              </p>
            )}
          </div>
        )}
      </div>

      <nav
        className="mt-16 flex justify-between border-t border-line pt-6"
        aria-label={t('pages.gallery')}
      >
        <Link to={`/galerie/${previous.slug}`} className="btn-link" rel="prev">
          {t('artworkDetail.previous')}
        </Link>
        <Link to={`/galerie/${next.slug}`} className="btn-link" rel="next">
          {t('artworkDetail.next')}
        </Link>
      </nav>

      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          index={index}
          onIndexChange={(i) =>
            navigate(`/galerie/${list[i].slug}`, { replace: true })
          }
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  )
}
