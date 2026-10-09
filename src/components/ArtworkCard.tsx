import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useGalleryVisibility } from '../config/gallerySettings'
import type { Artwork } from '../data'
import { buildSrcSet } from '../lib/imageVariants'
import { trackArtwork } from '../lib/track'
import { artworkAlt, hasDimensions } from '../lib/artwork'

type ArtworkCardProps = {
  artwork: Artwork
  className?: string
  /** Bilder im sichtbaren Bereich nicht lazy laden. */
  priority?: boolean
  /** Breite des Bildes je Bildschirm, damit der Browser die passende Größe wählt. */
  sizes?: string
}

// Spalten wie in den Rastern von Galerie und Startseite
const GRID_SIZES =
  '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

export default function ArtworkCard({
  artwork,
  className = '',
  priority = false,
  sizes = GRID_SIZES,
}: ArtworkCardProps) {
  const { t } = useTranslation()
  const visible = useGalleryVisibility()
  const figure = useRef<HTMLElement>(null)

  // Zählt die Anzeige, sobald das Werk zur Hälfte sichtbar ist (anonym, einmal je Sitzung)
  useEffect(() => {
    const node = figure.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackArtwork(artwork.id, 'view')
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [artwork.id])

  // Nur vorhandene und freigegebene Angaben erscheinen, sonst entfällt die Bildunterschrift ganz.
  const meta = [
    visible.year && artwork.year != null ? String(artwork.year) : null,
    visible.dimensions && hasDimensions(artwork)
      ? t('artwork.dimensions', {
          height: artwork.heightCm,
          width: artwork.widthCm,
        })
      : null,
  ].filter(Boolean)
  const status =
    visible.availability && artwork.status && artwork.status !== 'verfuegbar'
      ? t(`artwork.status.${artwork.status}`)
      : null
  const hasCaption = artwork.titleDe || meta.length > 0 || status

  return (
    <figure ref={figure} className={`m-0 ${className}`}>
      <Link
        to={`/galerie/${artwork.slug}`}
        className="block"
        aria-label={artwork.titleDe ?? t('artwork.untitled')}
      >
        <img
          src={artwork.mainImageUrl}
          srcSet={buildSrcSet(
            artwork.mainImageUrl,
            artwork.imageWidth,
            artwork.imageVariants,
          )}
          sizes={sizes}
          width={artwork.imageWidth}
          height={artwork.imageHeight}
          alt={artworkAlt(artwork, t('artwork.untitled'), visible.year)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="artwork-img"
        />
      </Link>
      {hasCaption && (
        <figcaption className="mt-3 text-sm leading-snug">
          {artwork.titleDe && <span className="block">{artwork.titleDe}</span>}
          {meta.length > 0 && (
            <span className="block text-muted">{meta.join(' · ')}</span>
          )}
          {status && <span className="label mt-1 block">{status}</span>}
        </figcaption>
      )}
    </figure>
  )
}
