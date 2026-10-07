import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useGalleryVisibility } from '../config/gallerySettings'
import type { Artwork } from '../data'
import { artworkAlt, hasDimensions } from '../lib/artwork'

type ArtworkCardProps = {
  artwork: Artwork
  className?: string
  /** Bilder im sichtbaren Bereich nicht lazy laden. */
  priority?: boolean
}

export default function ArtworkCard({
  artwork,
  className = '',
  priority = false,
}: ArtworkCardProps) {
  const { t } = useTranslation()
  const visible = useGalleryVisibility()

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
    <figure className={`m-0 ${className}`}>
      <Link
        to={`/galerie/${artwork.slug}`}
        className="block"
        aria-label={artwork.titleDe ?? t('artwork.untitled')}
      >
        <img
          src={artwork.mainImageUrl}
          width={artwork.imageWidth}
          height={artwork.imageHeight}
          alt={artworkAlt(artwork, t('artwork.untitled'), visible.year)}
          loading={priority ? 'eager' : 'lazy'}
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
