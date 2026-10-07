import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { EventItem } from '../data'
import { freeSeats } from '../lib/events'
import {
  formatDay,
  formatLongDate,
  formatMonthYear,
  formatTime,
} from '../lib/format'

export default function EventRow({ event }: { event: EventItem }) {
  const { t } = useTranslation()
  const free = freeSeats(event)
  const href = `/netzwerk/${event.slug}`
  return (
    <li className="grid-12 gap-y-4 border-b border-line py-8 md:py-10">
      <p className="col-span-4 text-[clamp(3.5rem,2rem+6vw,6.5rem)] leading-none md:col-span-3">
        {formatDay(event.startsAt)}
        <span className="label mt-2 block">
          {formatMonthYear(event.startsAt)}
        </span>
      </p>
      <div className="col-span-4 md:col-span-6">
        <h3>
          <Link to={href} className="no-underline">
            {event.titleDe}
          </Link>
        </h3>
        <p className="mt-3 text-muted">
          {formatLongDate(event.startsAt)} ·{' '}
          {t('network.clock', { time: formatTime(event.startsAt) })}
        </p>
        <p className="text-muted">{event.locationName}</p>
        {event.registrationOpen && (
          <p className="label mt-3">
            {free > 0
              ? t('network.seatsFree', { count: free })
              : t('network.seatsFull')}
          </p>
        )}
      </div>
      <div className="col-span-4 md:col-span-3 md:text-right">
        <Link to={href} className="btn">
          {t('network.register')}
        </Link>
      </div>
    </li>
  )
}
