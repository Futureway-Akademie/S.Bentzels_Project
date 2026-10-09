import type { TFunction } from 'i18next'
import { formatLongDate, formatTime } from './format'

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/**
 * Datum und Uhrzeit eines Termins als eine Zeile, nur mit vorhandenen Angaben.
 * Mehrtägig: „14. November 2026 bis 16. November 2026“.
 */
export function formatEventDate(
  startsAt: string | null,
  endsAt: string | null,
  showTime: boolean,
  t: TFunction,
): string | null {
  if (!startsAt) return null
  const start = new Date(startsAt)
  const end = endsAt ? new Date(endsAt) : null
  if (end && !sameDay(start, end)) {
    return t('events.dateRange', {
      from: formatLongDate(startsAt),
      to: formatLongDate(endsAt!),
    })
  }
  const date = formatLongDate(startsAt)
  if (!showTime) return date
  const time =
    end && end.getTime() > start.getTime()
      ? t('events.clockRange', {
          from: formatTime(startsAt),
          to: formatTime(endsAt!),
        })
      : t('events.clock', { time: formatTime(startsAt) })
  return `${date} · ${time}`
}
