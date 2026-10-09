import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  dayKey,
  monthGrid,
  occurrencesByDay,
  type Occurrence,
} from '../../lib/eventCalendar'
import { formatMonthKey, formatTime, weekdayLabels } from '../../lib/format'

type Props = {
  /** JJJJ-MM */
  month: string
  occurrences: Occurrence[]
  onMonth: (key: string) => void
}

const MAX_PER_DAY = 3

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Ruhige Monatsansicht für breite Bildschirme. Auf dem Smartphone zeigt die Seite stattdessen
// die Liste des Monats, die Navigation bleibt gleich.
export default function MonthCalendar({ month, occurrences, onMonth }: Props) {
  const { t } = useTranslation()
  const [year, monthNumber] = month.split('-').map(Number)
  const weeks = monthGrid(year, monthNumber - 1)
  const byDay = occurrencesByDay(occurrences)
  const [today] = useState(() => dayKey(new Date()))
  const title = formatMonthKey(month)
  const labels = weekdayLabels()

  return (
    <div data-month-calendar={month}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          className="btn-link"
          onClick={() => onMonth(shiftMonth(month, -1))}
        >
          {t('events.prevMonth')}
        </button>
        <h3
          className="m-0 text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)]"
          aria-live="polite"
        >
          {title}
        </h3>
        <button
          type="button"
          className="btn-link"
          onClick={() => onMonth(shiftMonth(month, 1))}
        >
          {t('events.nextMonth')}
        </button>
      </div>

      <table className="mt-8 hidden w-full table-fixed border-collapse md:table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            {labels.map((label) => (
              <th
                key={label}
                scope="col"
                className="label border-b border-line pb-3 text-left font-normal"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={index}>
              {week.map((date, cell) => {
                if (!date)
                  return <td key={cell} className="border-b border-line p-0" />
                const key = dayKey(date)
                const items = byDay.get(key) ?? []
                return (
                  <td
                    key={cell}
                    className="h-32 border-b border-l border-line p-2 align-top first:border-l-0"
                    data-day={key}
                  >
                    <span
                      className={`label block ${key === today ? 'text-foreground' : ''}`}
                    >
                      {date.getDate()}
                      {key === today && (
                        <span className="sr-only"> {t('events.today')}</span>
                      )}
                    </span>
                    <ul className="m-0 mt-2 list-none space-y-1 p-0 text-[0.875rem] leading-snug">
                      {items.slice(0, MAX_PER_DAY).map((o) => (
                        <li key={`${o.eventId}${o.startsAt}`}>
                          <Link
                            to={`/veranstaltungen/${o.slug}`}
                            className={`block truncate ${o.isCancelled ? 'text-muted line-through' : 'no-underline'}`}
                            title={o.titleDe}
                          >
                            {o.showTime && key === dayKey(new Date(o.startsAt))
                              ? `${formatTime(o.startsAt)} `
                              : ''}
                            {o.titleDe}
                          </Link>
                        </li>
                      ))}
                      {items.length > MAX_PER_DAY && (
                        <li className="text-muted">
                          {t('events.moreOnDay', {
                            count: items.length - MAX_PER_DAY,
                          })}
                        </li>
                      )}
                    </ul>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
