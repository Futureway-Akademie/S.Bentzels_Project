import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Artwork } from '../data'

type ArtworkCardProps = {
  artwork: Artwork
  className?: string
  /** Erstes Bild im sichtbaren Bereich nicht lazy laden. */
  priority?: boolean
}

export default function ArtworkCard({
  artwork,
  className = '',
  priority = false,
}: ArtworkCardProps) {
  const { t } = useTranslation()
  const showStatus = artwork.status !== 'verfuegbar'
  return (
    <figure className={`m-0 ${className}`}>
      <Link to={`/galerie/${artwork.slug}`} className="block">
        <img
          src={artwork.mainImageUrl}
          width={artwork.imageWidth}
          height={artwork.imageHeight}
          alt={`${artwork.titleDe}, ${artwork.year}`}
          loading={priority ? 'eager' : 'lazy'}
          className="artwork-img"
        />
      </Link>
      <figcaption className="mt-3 text-sm leading-snug">
        <span className="block">{artwork.titleDe}</span>
        <span className="block text-muted">
          {artwork.year} ·{' '}
          {t('artwork.dimensions', {
            height: artwork.heightCm,
            width: artwork.widthCm,
          })}
        </span>
        {showStatus && (
          <span className="label mt-1 block">
            {t(`artwork.status.${artwork.status}`)}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
