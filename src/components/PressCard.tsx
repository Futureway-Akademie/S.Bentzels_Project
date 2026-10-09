import { useTranslation } from 'react-i18next'
import type { PressItem } from '../data'
import { pressDateLabel } from '../lib/press'

type PressCardProps = {
  item: PressItem
  featured?: boolean
  /** Name der Kategorie aus dem Dashboard */
  categoryName?: string | null
  onOpenImage: (id: string) => void
}

// Zeigt nur vorhandene Angaben. Ein Eintrag mit nur einer Datei besteht aus Vorschau und Aktion.
export default function PressCard({
  item,
  featured = false,
  categoryName = null,
  onOpenImage,
}: PressCardProps) {
  const { t } = useTranslation()

  const preview =
    item.thumbnailUrl && item.thumbnailWidth && item.thumbnailHeight
      ? {
          src: item.thumbnailUrl,
          width: item.thumbnailWidth,
          height: item.thumbnailHeight,
        }
      : item.fileType === 'image' &&
          item.fileUrl &&
          item.fileWidth &&
          item.fileHeight
        ? { src: item.fileUrl, width: item.fileWidth, height: item.fileHeight }
        : null

  const date = pressDateLabel(item)
  const metaLine = [
    categoryName,
    item.mediumType && !item.medium
      ? t(`press.medium.${item.mediumType}`)
      : null,
    item.medium,
    date,
  ].filter(Boolean)
  const author = item.author ? t('press.by', { author: item.author }) : null
  const alt = item.titleDe ?? t('press.documentAlt')
  const hasFile = !!item.fileUrl && !!item.fileType

  const openFile =
    item.fileType === 'image' ? (
      <button
        type="button"
        className="btn-link"
        onClick={() => onOpenImage(item.id)}
      >
        {t('press.view')}
      </button>
    ) : item.fileType === 'pdf' && item.fileUrl ? (
      <a
        href={item.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-link"
      >
        {t('press.viewPdf')}
        <span className="sr-only"> ({t('press.newTab')})</span>
      </a>
    ) : null

  const previewNode = preview ? (
    <img
      src={preview.src}
      width={preview.width}
      height={preview.height}
      alt={item.titleDe ? `${t('press.thumbAlt')}: ${alt}` : alt}
      loading="lazy"
      className="artwork-img"
    />
  ) : item.fileType === 'pdf' ? (
    <span className="flex aspect-[3/4] items-center justify-center border border-line label">
      {t('press.pdfLabel')}
    </span>
  ) : null

  return (
    <article
      className={featured ? 'press-card press-card-featured' : 'press-card'}
    >
      {previewNode &&
        (item.fileType === 'image' ? (
          <button
            type="button"
            onClick={() => onOpenImage(item.id)}
            tabIndex={-1}
            aria-hidden="true"
            className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
          >
            {previewNode}
          </button>
        ) : item.fileType === 'pdf' && item.fileUrl ? (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden="true"
            className="block"
          >
            {previewNode}
          </a>
        ) : (
          previewNode
        ))}

      {(metaLine.length > 0 ||
        item.titleDe ||
        author ||
        item.summaryDe ||
        item.descriptionDe) && (
        <div className="mt-4">
          {metaLine.length > 0 && (
            <p className="label">{metaLine.join(' · ')}</p>
          )}
          {item.titleDe && (
            <h3
              className={
                featured
                  ? 'mt-2 text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)]'
                  : 'mt-2 text-[1.375rem] leading-snug'
              }
            >
              {item.titleDe}
            </h3>
          )}
          {author && <p className="mt-1 text-muted">{author}</p>}
          {item.summaryDe && (
            <p className="prose-measure mt-3">{item.summaryDe}</p>
          )}
          {item.descriptionDe && (
            <p className="prose-measure mt-3 text-muted">
              {item.descriptionDe}
            </p>
          )}
        </div>
      )}

      {(hasFile || item.externalUrl) && (
        <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          {openFile}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              {t('press.original')}
              <span className="sr-only"> ({t('press.newTab')})</span>
            </a>
          )}
        </p>
      )}
    </article>
  )
}
