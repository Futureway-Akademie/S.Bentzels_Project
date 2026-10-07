import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ArtworkCard from '../components/ArtworkCard'
import Button from '../components/Button'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { routes } from '../config/routes'
import { artworks, events, placeholderImage, posts } from '../data'
import {
  formatDay,
  formatLongDate,
  formatMonthYear,
  formatTime,
} from '../lib/format'

const heroImage = { width: 2400, height: 1100 }

export default function Home() {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())

  const highlights = artworks
    .filter((a) => a.isPublished && a.isHighlight)
    .slice(0, 6)
  const multipart = highlights.filter((a) => a.isMultipart)
  const singles = highlights.filter((a) => !a.isMultipart)

  const nextEvent = events
    .filter((e) => e.isPublished && new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]

  const latestPost = posts
    .filter((p) => p.isPublished && p.status === 'veroeffentlicht')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]

  return (
    <main>
      {/* Hero */}
      <section className="container-page pt-12 md:pt-20">
        <p className="label">{t('home.heroLabel')}</p>
        <h1 className="mt-6 max-w-[14ch]">{t('brand.name')}</h1>
      </section>
      <section className="mt-10 md:mt-16">
        <img
          src={placeholderImage(heroImage.width, heroImage.height)}
          width={heroImage.width}
          height={heroImage.height}
          alt={t('home.heroAlt')}
          fetchPriority="high"
          className="artwork-img"
        />
      </section>

      {/* Statement */}
      <section className="container-page mt-24 md:mt-40">
        <Reveal>
          <p className="max-w-[28ch] text-[clamp(1.75rem,1.1rem+3vw,3.5rem)] leading-[1.2]">
            {t('home.statement')}
          </p>
        </Reveal>
      </section>

      {/* 01 Ausgewählte Werke */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="home-works"
      >
        <Reveal>
          <SectionLabel number={1}>{t('home.works')}</SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="home-works" className="sr-only">
            {t('home.works')}
          </h2>
        </Reveal>
        <div className="mt-10 space-y-12">
          {multipart.map((artwork) => (
            <Reveal key={artwork.id}>
              <ArtworkCard artwork={artwork} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 columns-1 gap-x-6 sm:columns-2 lg:columns-3">
          {singles.map((artwork) => (
            <Reveal key={artwork.id} className="mb-12 break-inside-avoid">
              <ArtworkCard artwork={artwork} />
            </Reveal>
          ))}
        </div>
        <div className="mt-4">
          <Button to={routes.gallery} variant="link">
            {t('home.allWorks')}
          </Button>
        </div>
      </section>

      {/* 02 The Art of Becoming */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="home-becoming"
      >
        <Reveal>
          <SectionLabel number={2}>{t('home.becoming')}</SectionLabel>
          <hr className="rule mt-4" />
          <p className="label mt-8">{t('home.formatLabel')}</p>
          <h2 id="home-becoming" className="mt-4 max-w-[20ch]">
            {t('home.becomingQuote')}
          </h2>
          <div className="mt-10">
            <Button to={routes.artOfBecoming}>
              {t('home.becomingButton')}
            </Button>
          </div>
        </Reveal>
      </section>

      {/* 03 Nächste Begegnung */}
      {nextEvent && (
        <section
          className="container-page mt-24 md:mt-40"
          aria-labelledby="home-event"
        >
          <Reveal>
            <SectionLabel number={3}>{t('home.nextEvent')}</SectionLabel>
            <hr className="rule mt-4" />
            <h2 id="home-event" className="sr-only">
              {t('home.nextEvent')}
            </h2>
            <div className="grid-12 mt-10 gap-y-6">
              <p className="col-span-4 text-[clamp(4rem,2rem+10vw,9rem)] leading-none md:col-span-4">
                {formatDay(nextEvent.startsAt)}
                <span className="label mt-3 block">
                  {formatMonthYear(nextEvent.startsAt)}
                </span>
              </p>
              <div className="col-span-4 md:col-span-8">
                <h3>
                  <Link
                    to={`/netzwerk/${nextEvent.slug}`}
                    className="no-underline"
                  >
                    {nextEvent.titleDe}
                  </Link>
                </h3>
                <p className="mt-4 text-muted">
                  {formatLongDate(nextEvent.startsAt)} ·{' '}
                  {t('home.clock', { time: formatTime(nextEvent.startsAt) })}
                </p>
                <p className="text-muted">{nextEvent.locationName}</p>
                <div className="mt-8">
                  <Button to={routes.network}>{t('home.allEvents')}</Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* 04 Journal */}
      {latestPost && (
        <section
          className="container-page mt-24 md:mt-40"
          aria-labelledby="home-journal"
        >
          <Reveal>
            <SectionLabel number={nextEvent ? 4 : 3}>
              {t('home.journal')}
            </SectionLabel>
            <hr className="rule mt-4" />
            <h2 id="home-journal" className="sr-only">
              {t('home.journal')}
            </h2>
            <div className="grid-12 mt-10 gap-y-6">
              <Link
                to={`/journal/${latestPost.slug}`}
                className="col-span-4 block md:col-span-6"
                aria-label={latestPost.titleDe}
              >
                <img
                  src={latestPost.coverImageUrl}
                  width={latestPost.coverImageWidth}
                  height={latestPost.coverImageHeight}
                  alt=""
                  loading="lazy"
                  className="artwork-img"
                />
              </Link>
              <div className="col-span-4 md:col-span-5 md:col-start-8">
                <p className="label">
                  {formatLongDate(latestPost.publishedAt)}
                </p>
                <h3 className="mt-4">{latestPost.titleDe}</h3>
                <p className="prose-measure mt-4">{latestPost.excerptDe}</p>
                <div className="mt-8">
                  <Button to={`/journal/${latestPost.slug}`} variant="link">
                    {t('home.readPost')}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </main>
  )
}
