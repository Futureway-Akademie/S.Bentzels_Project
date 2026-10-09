import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  publicStatus,
  type Occurrence,
  type PublicEvent,
} from '../../lib/eventCalendar'
import { formatEventDate } from '../../lib/eventFormat'
import { formatDay, formatMonthYear } from '../../lib/format'
import EventStatus from './EventStatus'

type Props = {
  event: PublicEvent
  occurrence: Occurrence
  typeName: string | null
  /** Zahl weiterer Termine der Veranstaltung, nur in der Ansicht „Kommende“ */
  moreDates?: number
}

// Zeile für Listen: großes Datum links, Angaben rechts. Auf dem Smartphone untereinander.
export default function EventListItem({
  event,
  occurrence,
  typeName,
  moreDates = 0,
}: Props) {
  const { t } = useTranslation()
  const href = `/veranstaltungen/${event.slug}`
  const status = occurrence.isCancelled
    ? 'abgesagt'
    : publicStatus(event, false)
  const date = formatEventDate(
    occurrence.startsAt,
    occurrence.endsAt,
    occurrence.showTime,
    t,
  )
  return (
    <li
      className="grid-12 gap-y-3 border-b border-line py-7 md:py-9"
      data-occurrence={`${event.slug}@${occurrence.startsAt}`}
    >
      <p className="col-span-4 text-[clamp(2.75rem,1.75rem+5vw,5.5rem)] leading-none md:col-span-3">
        {formatDay(occurrence.startsAt)}
        <span className="label mt-2 block">
          {formatMonthYear(occurrence.startsAt)}
        </span>
      </p>
      <div className="col-span-4 md:col-span-6">
        {typeName && <p className="label">{typeName}</p>}
        <h3 className="mt-1">
          <Link
            to={href}
            className={
              occurrence.isCancelled
                ? 'text-muted line-through'
                : 'no-underline'
            }
          >
            {event.titleDe}
          </Link>
        </h3>
        {date && <p className="mt-2 text-muted">{date}</p>}
        {occurrence.noteDe && <p className="text-muted">{occurrence.noteDe}</p>}
        {event.locationName && (
          <p className="text-muted">{event.locationName}</p>
        )}
        {moreDates > 0 && (
          <p className="label mt-2">
            {t('events.moreDates', { count: moreDates })}
          </p>
        )}
        {status && (
          <p className="mt-2">
            <EventStatus status={status} />
          </p>
        )}
      </div>
      <div className="col-span-4 md:col-span-3 md:text-right">
        <Link to={href} className="btn-link">
          {t('events.details')}
        </Link>
      </div>
    </li>
  )
}
