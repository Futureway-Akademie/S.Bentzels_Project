import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import ContentGate from '../components/ContentGate'
import type { Post } from '../data'
import { loadPosts } from '../lib/content'
import { formatLongDate } from '../lib/format'
import { useLoad } from '../lib/useLoad'

function JournalContent({ list }: { list: Post[] }) {
  const { t } = useTranslation()

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
                aria-label={post.titleDe ?? t('journal.untitled')}
              >
                {post.coverImageUrl &&
                post.coverImageWidth &&
                post.coverImageHeight ? (
                  <img
                    src={post.coverThumbUrl ?? post.coverImageUrl}
                    width={post.coverImageWidth}
                    height={post.coverImageHeight}
                    alt=""
                    loading="lazy"
                    className="artwork-img"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="block aspect-[3/2] border border-line"
                  />
                )}
              </Link>
              <div className="col-span-4 md:col-span-6 md:col-start-7">
                {post.publishedAt && (
                  <p className="label">{formatLongDate(post.publishedAt)}</p>
                )}
                <h2 className="mt-4 text-[clamp(1.75rem,1.2rem+2vw,3rem)]">
                  <Link to={`/journal/${post.slug}`} className="no-underline">
                    {post.titleDe ?? t('journal.untitled')}
                  </Link>
                </h2>
                {post.excerptDe && (
                  <p className="prose-measure mt-4">{post.excerptDe}</p>
                )}
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

export default function Journal() {
  const { state, reload } = useLoad(loadPosts)
  return (
    <ContentGate state={state} reload={reload}>
      {(list) => <JournalContent list={list} />}
    </ContentGate>
  )
}
