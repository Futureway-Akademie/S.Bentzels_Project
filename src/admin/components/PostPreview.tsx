import { useTranslation } from 'react-i18next'
import { formatLongDate } from '../../lib/format'
import { sanitizeHtml } from '../../lib/sanitizeHtml'

type PostPreviewProps = {
  title: string | null
  excerpt: string | null
  publishedAt: string | null
  coverUrl: string | null
  coverWidth: number | null
  coverHeight: number | null
  html: string
}

// Zeigt den Beitrag so, wie ihn Besucher später lesen (gleiche Typografie wie die öffentliche Seite).
export default function PostPreview({
  title,
  excerpt,
  publishedAt,
  coverUrl,
  coverWidth,
  coverHeight,
  html,
}: PostPreviewProps) {
  const { t } = useTranslation()
  return (
    <article
      className="border border-line p-4 md:p-8"
      aria-label={t('admin.journal.previewLabel')}
    >
      <header>
        {publishedAt && <p className="label">{formatLongDate(publishedAt)}</p>}
        <h2 className="mt-4 max-w-[18ch] text-[clamp(2rem,1.4rem+3vw,4rem)]">
          {title ?? t('admin.journal.untitled')}
        </h2>
      </header>
      {coverUrl && (
        <img
          src={coverUrl}
          width={coverWidth ?? undefined}
          height={coverHeight ?? undefined}
          alt=""
          className="artwork-img mt-8"
        />
      )}
      <div className="mx-auto mt-10 max-w-[65ch] text-[1.1875rem] leading-[1.75]">
        {excerpt && (
          <p className="mb-7 text-[1.375rem] leading-[1.5]">{excerpt}</p>
        )}
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </div>
    </article>
  )
}
