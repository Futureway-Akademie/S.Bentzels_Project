import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import { curatedLinks } from '../data'
import { hostOf } from '../lib/press'

export default function CuratedArticles() {
  const { t } = useTranslation()
  const list = curatedLinks
    .filter((l) => l.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t('pages.curated')}</h1>
      <p className="prose-measure mt-10">{t('press.curatedIntro')}</p>

      {list.length === 0 ? (
        <p className="mt-16 text-muted">{t('press.curatedEmpty')}</p>
      ) : (
        <ul className="m-0 mt-16 list-none p-0">
          {list.map((link) => {
            const host = hostOf(link.url)
            const title = link.titleDe ?? host
            const sourceLine = [link.source, link.titleDe ? host : null]
              .filter(Boolean)
              .join(' · ')
            return (
              <Reveal
                as="li"
                key={link.id}
                className="grid-12 gap-y-6 border-t border-line py-10"
              >
                {link.thumbnailUrl &&
                  link.thumbnailWidth &&
                  link.thumbnailHeight && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="col-span-4 block md:col-span-4"
                    >
                      <img
                        src={link.thumbnailUrl}
                        width={link.thumbnailWidth}
                        height={link.thumbnailHeight}
                        alt=""
                        loading="lazy"
                        className="artwork-img"
                      />
                    </a>
                  )}
                <div
                  className={
                    link.thumbnailUrl
                      ? 'col-span-4 md:col-span-7 md:col-start-6'
                      : 'col-span-4 md:col-span-8'
                  }
                >
                  {sourceLine && <p className="label">{sourceLine}</p>}
                  <h2 className="mt-3 text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)]">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      {title}
                      <span className="sr-only"> ({t('press.newTab')})</span>
                    </a>
                  </h2>
                  {link.noteDe && (
                    <p className="prose-measure mt-4">{link.noteDe}</p>
                  )}
                  <p className="mt-6">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      {t('press.curatedRead')}
                      <span className="sr-only"> ({t('press.newTab')})</span>
                    </a>
                  </p>
                </div>
              </Reveal>
            )
          })}
        </ul>
      )}
    </main>
  )
}
