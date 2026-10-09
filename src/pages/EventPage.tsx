import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import EventStatus from '../components/events/EventStatus'
import InquiryForm from '../components/forms/LazyInquiryForm'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import {
  isPastEvent,
  paragraphs,
  publicStatus,
  registrationIsOpen,
  type PublicEvent,
} from '../lib/eventCalendar'
import { formatEventDate } from '../lib/eventFormat'
import { anmeldungFields, veranstaltungFields } from '../lib/forms/definitions'
import { RegistrationError, submitRegistration } from '../lib/forms/submit'
import { registrationSchema } from '../../supabase/functions/_shared/schemas'
import { formatLongDate, formatPriceExact } from '../lib/format'
import {
  loadEventDetail,
  trackEvent,
  type EventDetailData,
} from '../lib/publicEvents'
import { useSeo } from '../lib/seo'
import { eventLd, summarize } from '../lib/seoLd'
import { site } from '../config/site'
import { useLoad } from '../lib/useLoad'

function Block({ title, text }: { title: string; text: string | null }) {
  const parts = paragraphs(text)
  if (parts.length === 0) return null
  return (
    <div className="mt-10">
      <h3 className="label">{title}</h3>
      {parts.map((part) => (
        <p key={part} className="prose-measure mt-3">
          {part}
        </p>
      ))}
    </div>
  )
}

function Detail({
  data,
  event,
}: {
  data: EventDetailData
  event: PublicEvent
}) {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())
  const [formOpen, setFormOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const { occurrences, photos, types } = data

  useEffect(() => {
    trackEvent(event.id, 'detail')
  }, [event.id])

  const typeName =
    types.find((type) => type.id === event.typeId)?.nameDe ?? null
  const past = isPastEvent(event, occurrences, now)
  const status = publicStatus(event, past)
  const cancelled = event.status === 'abgesagt'
  const canInquire = !past && !cancelled
  const interest = registrationIsOpen(event, now)
  // Verbindliche Anmeldung mit Platzprüfung statt reiner Anfrage
  const binding = event.registrationMode === 'verbindlich'
  const registering = binding && interest && canInquire
  const full = event.placesAvailable === 0 || event.status === 'ausgebucht'
  const fewLeft =
    event.placesAvailable !== null &&
    event.placesAvailable > 0 &&
    event.placesAvailable < 10
  const sorted = [...occurrences].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  )
  const several = sorted.length > 1

  const first = sorted[0]
  const dateLine = first
    ? formatEventDate(first.startsAt, first.endsAt, first.showTime, t)
    : null

  useSeo({
    title: event.titleDe,
    description:
      summarize(event.shortDescriptionDe) ??
      summarize(event.descriptionDe) ??
      summarize(
        [typeName, dateLine, event.locationName].filter(Boolean).join(' · '),
      ),
    image: event.imageUrl,
    jsonLd: eventLd(site, event, {
      startsAt: first?.startsAt ?? null,
      endsAt: first?.endsAt ?? null,
    }),
  })

  const facts: [string, string][] = []
  if (dateLine && !several) facts.push([t('events.fact.date'), dateLine])
  if (event.locationName || event.locationAddress)
    facts.push([
      t('events.fact.location'),
      [event.locationName, event.locationAddress].filter(Boolean).join(', '),
    ])
  if (event.speakerName)
    facts.push([t('events.fact.speaker'), event.speakerName])
  if (event.capacity !== null)
    facts.push([
      t('events.fact.capacity'),
      t('events.capacityValue', { count: event.capacity }),
    ])
  if (
    event.placesAvailable !== null &&
    !past &&
    (!binding || event.placesAvailable < 10)
  )
    facts.push([
      t('events.fact.places'),
      event.placesAvailable === 0
        ? t('events.status.ausgebucht')
        : t('events.placesValue', { count: event.placesAvailable }),
    ])
  if (event.priceEur !== null || event.priceOnRequest) {
    const price =
      event.priceEur !== null
        ? t('events.priceInclVat', { price: formatPriceExact(event.priceEur) })
        : t('events.priceOnRequest')
    facts.push([
      t('events.fact.price'),
      [price, event.priceNoteDe].filter(Boolean).join(' · '),
    ])
  }
  if (event.registrationDeadline && !past)
    facts.push([
      t('events.fact.deadline'),
      formatLongDate(event.registrationDeadline),
    ])

  const contact = [
    event.contactName,
    event.contactEmail,
    event.contactPhone,
  ].some(Boolean)
  const mailFallback = `mailto:${t('footer.email')}?subject=${encodeURIComponent(
    t('events.inquiry.subject', { title: event.titleDe }),
  )}`

  const open = () => {
    setFormOpen(true)
    trackEvent(event.id, 'inquiry_click')
    setTimeout(
      () =>
        document
          .getElementById('event-inquiry')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50,
    )
  }

  return (
    <main className="container-page py-12 md:py-20">
      <p>
        <Link to="/veranstaltungen" className="btn-link">
          {t('events.back')}
        </Link>
      </p>
      <p className="label mt-10">
        {[typeName, event.category].filter(Boolean).join(' · ') ||
          t('events.label')}
      </p>
      <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,1.5rem+4vw,5.5rem)]">
        {event.titleDe}
      </h1>
      {status && (
        <p className="mt-6" data-event-status={status}>
          <EventStatus status={status} />
        </p>
      )}

      <div className="grid-12 mt-12 gap-y-10">
        {event.imageUrl && (
          <div className="col-span-4 md:col-span-7">
            <img
              src={event.imageUrl}
              width={event.imageWidth ?? 1600}
              height={event.imageHeight ?? 1067}
              alt={t('events.imageAlt', { title: event.titleDe })}
              fetchPriority="high"
              className="artwork-img"
            />
          </div>
        )}
        <div
          className={
            event.imageUrl
              ? 'col-span-4 md:col-span-4 md:col-start-9'
              : 'col-span-4 md:col-span-8'
          }
        >
          {facts.length > 0 && (
            <dl className="m-0">
              {facts.map(([label, value]) => (
                <div key={label} className="border-t border-line py-4">
                  <dt className="label">{label}</dt>
                  <dd className="m-0 mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {event.shortDescriptionDe && (
            <p className="prose-measure mt-6 text-[1.125rem]">
              {event.shortDescriptionDe}
            </p>
          )}
        </div>
      </div>

      {several && (
        <section className="mt-16" aria-labelledby="event-dates">
          <h2 id="event-dates" className="label">
            {t('events.dates')}
          </h2>
          <ul className="m-0 mt-4 list-none p-0">
            {sorted.map((o) => (
              <li
                key={o.startsAt}
                className={`border-t border-line py-3 ${o.isCancelled ? 'text-muted line-through' : ''}`}
              >
                {formatEventDate(o.startsAt, o.endsAt, o.showTime, t)}
                {o.noteDe && <span className="text-muted"> · {o.noteDe}</span>}
                {o.isCancelled && (
                  <span className="label no-underline">
                    {' '}
                    {t('events.dateCancelled')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(paragraphs(event.descriptionDe).length > 0 ||
        event.audienceDe ||
        event.requirementsDe ||
        event.materialsDe ||
        event.includedDe) && (
        <section className="mt-16" aria-label={t('events.about')}>
          {paragraphs(event.descriptionDe).map((part) => (
            <p key={part} className="prose-measure mt-4 first:mt-0">
              {part}
            </p>
          ))}
          <Block title={t('events.fact.audience')} text={event.audienceDe} />
          <Block
            title={t('events.fact.requirements')}
            text={event.requirementsDe}
          />
          <Block title={t('events.fact.materials')} text={event.materialsDe} />
          <Block title={t('events.fact.included')} text={event.includedDe} />
        </section>
      )}

      {(event.pdfUrl || event.externalUrl || contact) && (
        <section className="mt-16" aria-label={t('events.moreInfo')}>
          <h2 className="label">{t('events.moreInfo')}</h2>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-8 gap-y-3 p-0">
            {event.pdfUrl && (
              <li>
                <a
                  href={event.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  {event.pdfLabelDe ?? t('events.pdfDefault')}
                </a>
              </li>
            )}
            {event.externalUrl && (
              <li>
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  {t('events.externalLink')}
                </a>
              </li>
            )}
          </ul>
          {contact && (
            <p className="mt-6 text-muted">
              {[event.contactName].filter(Boolean).join('')}
              {event.contactName &&
                (event.contactEmail || event.contactPhone) &&
                ' · '}
              {event.contactEmail && (
                <a href={`mailto:${event.contactEmail}`} className="btn-link">
                  {event.contactEmail}
                </a>
              )}
              {event.contactEmail && event.contactPhone && ' · '}
              {event.contactPhone && (
                <a
                  href={`tel:${event.contactPhone.replace(/[^\d+]/g, '')}`}
                  className="btn-link"
                >
                  {event.contactPhone}
                </a>
              )}
            </p>
          )}
        </section>
      )}

      <section
        className="mt-20 md:mt-28"
        aria-labelledby="event-inquiry-title"
        id="event-inquiry"
      >
        <SectionLabel number={1}>
          {past
            ? t('events.recap')
            : t(
                interest
                  ? 'events.inquiry.interestTitle'
                  : 'events.inquiry.infoTitle',
              )}
        </SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="event-inquiry-title" className="sr-only">
          {t('events.inquiry.infoTitle')}
        </h2>
        <div className="mt-8">
          {cancelled && (
            <p className="text-muted">{t('events.cancelledNote')}</p>
          )}
          {past && !cancelled && (
            <>
              <p className="text-muted">{t('events.pastNote')}</p>
              {event.recapTextDe && (
                <p className="prose-measure mt-6">{event.recapTextDe}</p>
              )}
            </>
          )}
          {registering && (
            <div data-registration>
              {fewLeft && (
                <p className="label mb-6">
                  {t('events.registration.seatsLeft', {
                    count: event.placesAvailable ?? 0,
                  })}
                </p>
              )}
              {full && (
                <p className="mb-6 text-muted">
                  {t('events.registration.fullHint')}
                </p>
              )}
              <div className="max-w-xl">
                <InquiryForm
                  type="anmeldung"
                  schema={registrationSchema}
                  submitFn={submitRegistration}
                  fields={anmeldungFields}
                  fixed={{ eventId: event.id }}
                  submitKey={
                    full
                      ? 'events.registration.sendWaitlist'
                      : 'events.registration.send'
                  }
                  successFor={(result) =>
                    result === 'warteliste'
                      ? 'events.registration.thanksWaitlist'
                      : 'events.registration.thanksRegistered'
                  }
                  errorFor={(error) =>
                    error instanceof RegistrationError
                      ? error.code === 'duplicate'
                        ? 'events.registration.errorDuplicate'
                        : error.code === 'closed'
                          ? 'events.registration.errorClosed'
                          : null
                      : null
                  }
                  mailFallback={mailFallback}
                  onSent={() => trackEvent(event.id, 'inquiry')}
                />
              </div>
            </div>
          )}
          {!registering && binding && !past && !cancelled && (
            <p className="mb-6 text-muted">{t('events.registration.closed')}</p>
          )}
          {canInquire && !registering && !formOpen && !sent && (
            <button type="button" className="btn" onClick={open}>
              {t(
                interest
                  ? 'events.inquiry.interestButton'
                  : 'events.inquiry.infoButton',
              )}
            </button>
          )}
          {canInquire && !registering && formOpen && (
            <InquiryForm
              type="veranstaltung"
              fields={veranstaltungFields}
              fixed={{ eventId: event.id, interest }}
              submitKey={
                interest
                  ? 'events.inquiry.sendInterest'
                  : 'events.inquiry.sendInfo'
              }
              mailFallback={mailFallback}
              onSent={() => {
                setSent(true)
                trackEvent(event.id, 'inquiry')
              }}
            />
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mt-20 md:mt-28" aria-labelledby="event-photos">
          <SectionLabel number={2}>{t('events.photos')}</SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="event-photos" className="sr-only">
            {t('events.photos')}
          </h2>
          <div className="mt-10 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {photos.map((photo) => (
              <Reveal key={photo.id} className="mb-8 break-inside-avoid">
                <img
                  src={photo.thumbUrl ?? photo.imageUrl}
                  width={photo.imageWidth ?? 800}
                  height={photo.imageHeight ?? 600}
                  alt={t('events.photoAlt', { title: event.titleDe })}
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

export default function EventPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const load = useCallback(() => loadEventDetail(slug), [slug])
  const { state, reload } = useLoad(load)

  if (state.status === 'loading')
    return (
      <main className="container-page py-20 md:py-28">
        <p className="label" role="status">
          {t('events.loading')}
        </p>
      </main>
    )
  if (state.status === 'error')
    return (
      <main className="container-page py-20 md:py-28" role="alert">
        <p>{t('events.loadError')}</p>
        <p className="mt-4">
          <button type="button" className="btn" onClick={reload}>
            {t('events.retry')}
          </button>
        </p>
      </main>
    )
  if (!state.data.event)
    return (
      <main className="container-page py-20 md:py-28">
        <h1>{t('events.notFound')}</h1>
        <p className="mt-10">
          <Link to="/veranstaltungen" className="btn-link">
            {t('events.back')}
          </Link>
        </p>
      </main>
    )
  return (
    <Detail
      key={state.data.event.id}
      data={state.data}
      event={state.data.event}
    />
  )
}
