const locale = 'de-DE'

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(
    new Date(iso),
  )
}

export function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatTimeRange(
  startIso: string,
  endIso: string,
): { from: string; to: string } {
  return { from: formatTime(startIso), to: formatTime(endIso) }
}

export function formatWeekdayShort(iso: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
    new Date(iso),
  )
}

/** Monatsname und Jahr zu einem Schlüssel JJJJ-MM. */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

/** Kurzer Wochentag (Mo, Di, ...) für Montag = 0. */
export function weekdayLabels(): string[] {
  const monday = new Date(2024, 0, 1)
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      new Date(monday.getFullYear(), 0, monday.getDate() + i),
    ),
  )
}

/** Preis in Euro, mit Cent nur wenn nötig (89 € oder 89,50 €). */
export function formatPriceExact(value: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}
