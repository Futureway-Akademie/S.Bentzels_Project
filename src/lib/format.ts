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
