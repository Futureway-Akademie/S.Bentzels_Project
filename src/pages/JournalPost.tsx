import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { routes } from '../config/routes'
import { placeholderImage, posts } from '../data'
import { formatLongDate } from '../lib/format'
import { parsePostContent } from '../lib/postContent'
import PagePlaceholder from './PagePlaceholder'

const inlineImage = { width: 1600, height: 1067 }

export default function JournalPost() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const post = posts.find(
    (p) => p.isPublished && p.status === 'veroeffentlicht' && p.slug === slug,
  )
  if (!post) return <PagePlaceholder titleKey="journal.notFound" notFound />

  const blocks = parsePostContent(post.contentDe)

  return (
    <main className="container-page py-12 md:py-20">
      <p>
        <Link to={routes.journal} className="btn-link">
          {t('journal.back')}
        </Link>
      </p>
      <article className="mt-12">
        <header>
          <p className="label">{formatLongDate(post.publishedAt)}</p>
          <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,1.5rem+4vw,5.5rem)]">
            {post.titleDe}
          </h1>
        </header>
        <img
          src={post.coverImageUrl}
          width={post.coverImageWidth}
          height={post.coverImageHeight}
          alt=""
          fetchPriority="high"
          className="artwork-img mt-12"
        />
        <div className="mx-auto mt-16 max-w-[65ch] space-y-7 text-[1.1875rem] leading-[1.75]">
          <p className="text-[1.375rem] leading-[1.5]">{post.excerptDe}</p>
          {blocks.map((block, index) =>
            block.type === 'image' ? (
              <figure key={index} className="!my-12 m-0">
                <img
                  src={placeholderImage(inlineImage.width, inlineImage.height)}
                  width={inlineImage.width}
                  height={inlineImage.height}
                  alt={t('journal.imageAlt')}
                  loading="lazy"
                  className="artwork-img"
                />
              </figure>
            ) : (
              <p key={index}>{block.text}</p>
            ),
          )}
        </div>
      </article>
    </main>
  )
}
