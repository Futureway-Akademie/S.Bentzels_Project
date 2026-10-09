import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ContentGate from '../components/ContentGate'
import { routes } from '../config/routes'
import type { Post } from '../data'
import { loadPosts } from '../lib/content'
import { formatLongDate } from '../lib/format'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import { useSeo } from '../lib/seo'
import { postLd, summarize } from '../lib/seoLd'
import { site } from '../config/site'
import { useLoad } from '../lib/useLoad'
import PagePlaceholder from './PagePlaceholder'

function PostContent({ posts }: { posts: Post[] }) {
  const { t } = useTranslation()
  const { slug } = useParams()
  const post = posts.find((p) => p.slug === slug)
  useSeo(
    post
      ? {
          title: post.titleDe ?? t('pages.post'),
          description: summarize(post.excerptDe) ?? summarize(post.contentDe),
          image: post.coverImageUrl,
          type: 'article',
          jsonLd: postLd(site, post, t('pages.post')),
        }
      : { title: t('journal.notFound'), noindex: true },
  )
  if (!post) return <PagePlaceholder titleKey="journal.notFound" notFound />

  // Der Text kommt als HTML aus dem Editor und wird vor der Anzeige bereinigt.
  const html = post.contentDe ? sanitizeHtml(post.contentDe) : ''

  return (
    <main className="container-page py-12 md:py-20">
      <p>
        <Link to={routes.journal} className="btn-link">
          {t('journal.back')}
        </Link>
      </p>
      <article className="mt-12">
        <header>
          {post.publishedAt && (
            <p className="label">{formatLongDate(post.publishedAt)}</p>
          )}
          <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,1.5rem+4vw,5.5rem)]">
            {post.titleDe ?? t('journal.untitled')}
          </h1>
        </header>
        {post.coverImageUrl &&
          post.coverImageWidth &&
          post.coverImageHeight && (
            <img
              src={post.coverImageUrl}
              width={post.coverImageWidth}
              height={post.coverImageHeight}
              alt=""
              fetchPriority="high"
              className="artwork-img mt-12"
            />
          )}
        <div className="mx-auto mt-16 max-w-[65ch] text-[1.1875rem] leading-[1.75]">
          {post.excerptDe && (
            <p className="text-[1.375rem] leading-[1.5]">{post.excerptDe}</p>
          )}
          {html && (
            <div
              className="post-content mt-7"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </article>
    </main>
  )
}

export default function JournalPost() {
  const { state, reload } = useLoad(loadPosts)
  return (
    <ContentGate state={state} reload={reload}>
      {(posts) => <PostContent posts={posts} />}
    </ContentGate>
  )
}
