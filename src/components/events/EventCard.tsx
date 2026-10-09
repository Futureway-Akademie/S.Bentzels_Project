import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  publicStatus,
  type Occurrence,
  type PublicEvent,
} from '../../lib/eventCalendar'
import { formatEventDate } from '../../lib/eventFormat'
import EventStatus from './EventStatus'

type Props = {
  event: PublicEvent
  next: Occurrence | null
  typeName: string | null
  past?: boolean
  /** Erste Karten der Seite laden das Bild sofort */
  priority?: boolean
}

// Große Karte für „Nächste Veranstaltungen“ und das Archiv. Das Bild wird nie beschnitten.
export default function EventCard({
  event,
  next,
  typeName,
  past = false,
  priority = false,
}: Props) {
  const { t } = useTranslation()
  const image = event.imageThumbUrl ?? event.imageUrl
  const date = next
    ? formatEventDate(next.startsAt, next.endsAt, next.showTime, t)
    : null
  const status = publicStatus(event, past)
  return (
    <Link
      to={`/veranstaltungen/${event.slug}`}
      className="block no-underline"
      data-event-card={event.slug}
    >
      {image ? (
        <img
          src={image}
          width={event.imageWidth ?? 1600}
          height={event.imageHeight ?? 1067}
          alt={t('events.imageAlt', { title: event.titleDe })}
          loading={priority ? 'eager' : 'lazy'}
          className="artwork-img"
        />
      ) : (
        <span
          aria-hidden="true"
          className="block aspect-[3/2] border border-line"
        />
      )}
      <span className="label mt-4 block">
        {[typeName, date].filter(Boolean).join(' · ')}
      </span>
      <span className="mt-1 block text-[1.375rem] leading-snug">
        {event.titleDe}
      </span>
      {event.shortDescriptionDe && (
        <span className="mt-2 block text-muted">
          {event.shortDescriptionDe}
        </span>
      )}
      {event.locationName && (
        <span className="mt-1 block text-muted">{event.locationName}</span>
      )}
      {status && (
        <span className="mt-2 block">
          <EventStatus status={status} />
        </span>
      )}
    </Link>
  )
}
