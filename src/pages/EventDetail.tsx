import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { routes } from '../config/routes'
import { eventPhotos, events } from '../data'
import { freeSeats, isPast } from '../lib/events'
import { formatLongDate, formatTimeRange } from '../lib/format'
import PagePlaceholder from './PagePlaceholder'

export default function EventDetail() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const [now] = useState(() => Date.now())

  const event = events.find((e) => e.isPublished && e.slug === slug)
  if (!event) return <PagePlaceholder titleKey="event.notFound" notFound />

  const past = isPast(event, now)
  const canRegister = event.registrationOpen && !past
  const free = freeSeats(event)
  const photos = eventPhotos
    .filter((p) => p.eventId === event.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(
    t('network.registerSubject', { title: event.titleDe }),
  )}`
  const range = formatTimeRange(event.startsAt, event.endsAt)

  const facts: [string, string][] = [
    [t('event.date'), formatLongDate(event.startsAt)],
    [t('event.time'), t('courses.clock', range)],
    [t('event.location'), `${event.locationName}, ${event.locationAddress}`],
  ]

  return (
    <main className="container-page py-12 md:py-20">
      <p>
        <Link to={routes.network} className="btn-link">
          {t('event.back')}
        </Link>
      </p>
      <p className="label mt-10">{t('seminars.format')}</p>
      <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,1.5rem+4vw,5.5rem)]">
        {event.titleDe}
      </h1>

      <div className="grid-12 mt-12 gap-y-10">
        <div className="col-span-4 md:col-span-7">
          <img
            src={event.imageUrl}
            width={1600}
            height={1067}
            alt={t('event.coverAlt')}
            fetchPriority="high"
            className="artwork-img"
          />
        </div>
        <div className="col-span-4 md:col-span-4 md:col-start-9">
          <dl className="m-0">
            {facts.map(([label, value]) => (
              <div key={label} className="border-t border-line py-4">
                <dt className="label">{label}</dt>
                <dd className="m-0 mt-1">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="prose-measure mt-6">{event.descriptionDe}</p>
        </div>
      </div>

      <section className="mt-20 md:mt-28" aria-labelledby="event-registration">
        <SectionLabel number={1}>
          {past ? t('event.recap') : t('event.registration')}
        </SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="event-registration" className="sr-only">
          {past ? t('event.recap') : t('event.registration')}
        </h2>
        <div className="mt-8">
          {canRegister && (
            <>
              <p className="label">
                {free > 0
                  ? t('network.seatsFree', { count: free })
                  : t('network.seatsFull')}
              </p>
              <div className="mt-6">
                <a href={mailto} className="btn">
                  {t('network.register')}
                </a>
              </div>
            </>
          )}
          {!canRegister && !past && (
            <p className="text-muted">{t('event.closed')}</p>
          )}
          {past && (
            <>
              <p className="text-muted">{t('event.past')}</p>
              {event.recapTextDe && (
                <p className="prose-measure mt-6">{event.recapTextDe}</p>
              )}
            </>
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mt-20 md:mt-28" aria-labelledby="event-photos">
          <SectionLabel number={2}>{t('event.photos')}</SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="event-photos" className="sr-only">
            {t('event.photos')}
          </h2>
          <div className="mt-10 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {photos.map((photo) => (
              <Reveal key={photo.id} className="mb-8 break-inside-avoid">
                <img
                  src={photo.imageUrl}
                  width={photo.imageWidth}
                  height={photo.imageHeight}
                  alt={t('event.photoAlt')}
                  loading="lazy"
                  className="artwork-img"
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
