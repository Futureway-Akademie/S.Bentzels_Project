import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { posts } from '../data'
import { formatLongDate } from '../lib/format'

export default function Journal() {
  const { t } = useTranslation()
  const list = posts
    .filter((p) => p.isPublished && p.status === 'veroeffentlicht')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t('pages.journal')}</h1>
      <p className="prose-measure mt-10">{t('journal.intro')}</p>

      {list.length === 0 ? (
        <p className="mt-16 text-muted">{t('journal.empty')}</p>
      ) : (
        <ul className="m-0 mt-16 list-none p-0">
          {list.map((post) => (
            <Reveal
              as="li"
              key={post.id}
              className="grid-12 gap-y-6 border-t border-line py-10 md:py-14"
            >
              <Link
                to={`/journal/${post.slug}`}
                className="col-span-4 block md:col-span-5"
                aria-label={post.titleDe}
              >
                <img
                  src={post.coverImageUrl}
                  width={post.coverImageWidth}
                  height={post.coverImageHeight}
                  alt=""
                  loading="lazy"
                  className="artwork-img"
                />
              </Link>
              <div className="col-span-4 md:col-span-6 md:col-start-7">
                <p className="label">{formatLongDate(post.publishedAt)}</p>
                <h2 className="mt-4 text-[clamp(1.75rem,1.2rem+2vw,3rem)]">
                  <Link to={`/journal/${post.slug}`} className="no-underline">
                    {post.titleDe}
                  </Link>
                </h2>
                <p className="prose-measure mt-4">{post.excerptDe}</p>
                <p className="mt-6">
                  <Link to={`/journal/${post.slug}`} className="btn-link">
                    {t('journal.readMore')}
                  </Link>
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  )
}
