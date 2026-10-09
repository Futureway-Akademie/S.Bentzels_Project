import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import InquiryForm from '../components/forms/LazyInquiryForm'
import InquiryPanel from '../components/forms/InquiryPanel'
import Lightbox from '../components/Lightbox'
import { useGalleryVisibility } from '../config/gallerySettings'
import { routes } from '../config/routes'
import ContentGate from '../components/ContentGate'
import type { Artwork, ArtworkImage } from '../data'
import { loadArtworks } from '../lib/content'
import { useLoad } from '../lib/useLoad'
import { artworkAlt, hasDimensions } from '../lib/artwork'
import { werkFields } from '../lib/forms/definitions'
import { downloadDatasheet } from '../lib/datasheetFlow'
import { buildSrcSet } from '../lib/imageVariants'
import { useSeo } from '../lib/seo'
import { artworkLd, summarize } from '../lib/seoLd'
import { site } from '../config/site'
import { trackArtwork } from '../lib/track'
import { formatPrice } from '../lib/format'
import PagePlaceholder from './PagePlaceholder'

function ArtworkDetailContent({
  artworks,
  images,
}: {
  artworks: Artwork[]
  images: ArtworkImage[]
}) {
  const { t } = useTranslation()
  const { slug } = useParams()
  const navigate = useNavigate()
  const visible = useGalleryVisibility()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [sheetState, setSheetState] = useState<'idle' | 'busy' | 'error'>(
    'idle',
  )
  const inquiryTrigger = useRef<HTMLButtonElement>(null)

  const list = artworks
    .filter((a) => a.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const index = list.findIndex((a) => a.slug === slug)
  const artwork = list[index]
  const artworkId = artwork?.id

  // Das Öffnen der Werkseite zählt als Klick (anonym, einmal je Sitzung)
  useEffect(() => {
    if (artworkId) trackArtwork(artworkId, 'click')
  }, [artworkId])

  useSeo(
    artwork
      ? {
          title: artwork.titleDe ?? t('artwork.untitled'),
          description:
            summarize(artwork.descriptionDe) ??
            summarize(
              [
                artwork.titleDe ?? t('artwork.untitled'),
                visible.technique ? artwork.techniqueDe : null,
                visible.year ? artwork.year : null,
              ]
                .filter(Boolean)
                .join(', ') +
                '. ' +
                t('seo.artworkFallback'),
            ),
          image: artwork.mainImageUrl,
          jsonLd: artworkLd(
            site,
            {
              ...artwork,
              // Ausgeblendete Angaben gehören auch nicht in die strukturierten Daten
              year: visible.year ? artwork.year : null,
              techniqueDe: visible.technique ? artwork.techniqueDe : null,
              supportDe: visible.technique ? artwork.supportDe : null,
              heightCm: visible.dimensions ? artwork.heightCm : null,
              widthCm: visible.dimensions ? artwork.widthCm : null,
              depthCm: visible.dimensions ? artwork.depthCm : null,
              descriptionDe: visible.description ? artwork.descriptionDe : null,
              priceEur: visible.price ? artwork.priceEur : null,
              status: visible.availability ? artwork.status : null,
            },
            t('artwork.untitled'),
          ),
        }
      : { title: t('artworkDetail.notFound'), noindex: true },
  )

  if (!artwork)
    return <PagePlaceholder titleKey="artworkDetail.notFound" notFound />

  const extraImages = images
    .filter((image) => image.artworkId === artwork.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
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
          onClick={() => {
            setLightboxOpen(true)
            trackArtwork(artwork.id, 'lightbox')
          }}
          aria-label={t('artworkDetail.enlarge')}
          className="block max-w-full cursor-zoom-in border-0 bg-transparent p-0"
          style={{
            width: `min(100%, calc((100vh - 12rem) * ${artwork.imageWidth / artwork.imageHeight}))`,
          }}
        >
          <img
            src={artwork.mainImageUrl}
            srcSet={buildSrcSet(
              artwork.mainImageUrl,
              artwork.imageWidth,
              artwork.imageVariants,
            )}
            sizes="100vw"
            width={artwork.imageWidth}
            height={artwork.imageHeight}
            alt={alt}
            fetchPriority="high"
            className="artwork-img"
          />
        </button>
      </div>

      {extraImages.length > 0 && (
        <div className="mt-10 space-y-10">
          {extraImages.map((image) => (
            <div key={image.id} className="flex justify-center">
              <img
                src={image.imageUrl}
                srcSet={buildSrcSet(
                  image.imageUrl,
                  image.imageWidth,
                  image.imageVariants,
                )}
                sizes="(min-width: 960px) 960px, 100vw"
                width={image.imageWidth ?? 1600}
                height={image.imageHeight ?? 1067}
                alt={alt}
                loading="lazy"
                className="artwork-img"
                style={{ maxWidth: 'min(100%, 60rem)' }}
              />
            </div>
          ))}
        </div>
      )}

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
          <button
            ref={inquiryTrigger}
            type="button"
            className="btn-link"
            aria-haspopup="dialog"
            onClick={() => {
              setInquiryOpen(true)
              trackArtwork(artwork.id, 'inquiry')
            }}
          >
            {t('artworkDetail.inquire')}
          </button>
          <button
            type="button"
            className="btn-link"
            disabled={sheetState === 'busy'}
            onClick={() => {
              setSheetState('busy')
              // Öffentliche Fassung: nur Angaben, die laut Sichtbarkeit freigegeben sind
              // (die Datenbank liefert ausgeblendete Angaben gar nicht erst aus)
              downloadDatasheet({
                input: {
                  title: artwork.titleDe,
                  artist: artwork.artist,
                  cycle: artwork.cycle,
                  year: artwork.year,
                  technique: artwork.techniqueDe,
                  support: artwork.supportDe,
                  heightCm: artwork.heightCm,
                  widthCm: artwork.widthCm,
                  depthCm: artwork.depthCm,
                  framed: artwork.framed,
                  status: artwork.status,
                  priceEur: artwork.priceEur,
                  description: artwork.descriptionDe,
                },
                slug: artwork.slug,
                imageUrl: artwork.mainImageUrl,
                internal: false,
                t,
              })
                .then(() => setSheetState('idle'))
                .catch(() => setSheetState('error'))
            }}
          >
            {sheetState === 'busy'
              ? t('artworkDetail.datasheetBusy')
              : t('artworkDetail.datasheet')}
          </button>
        </div>
        {sheetState === 'error' && (
          <p role="alert" className="mt-4 text-muted">
            {t('artworkDetail.datasheetError')}
          </p>
        )}

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

      {inquiryOpen && (
        <InquiryPanel
          title={t('forms.workTitle')}
          returnFocus={inquiryTrigger}
          onClose={() => setInquiryOpen(false)}
        >
          <figure className="m-0 mb-8">
            <img
              src={artwork.thumbUrl ?? artwork.mainImageUrl}
              width={artwork.imageWidth}
              height={artwork.imageHeight}
              alt={alt}
              className="artwork-img max-h-56"
            />
            <figcaption className="mt-3">
              {title}
              {hasDimensions(artwork) && (
                <span className="text-muted">
                  {' · '}
                  {t('artwork.dimensions', {
                    height: artwork.heightCm,
                    width: artwork.widthCm,
                  })}
                </span>
              )}
            </figcaption>
          </figure>
          <InquiryForm
            type="werk"
            fields={werkFields}
            fixed={{ artworkId: artwork.id }}
            mailFallback={mailto}
          />
        </InquiryPanel>
      )}

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

export default function ArtworkDetail() {
  const { state, reload } = useLoad(loadArtworks)
  return (
    <ContentGate state={state} reload={reload}>
      {(data) => (
        <ArtworkDetailContent artworks={data.artworks} images={data.images} />
      )}
    </ContentGate>
  )
}
