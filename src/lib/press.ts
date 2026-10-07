import type { PressItem } from '../data'
import { formatLongDate } from './format'

export function pressYear(item: PressItem): number | null {
  if (item.publishedAt) return new Date(item.publishedAt).getFullYear()
  return item.year
}

/** Vollständiges Datum, sonst nur das Jahr, sonst nichts. */
export function pressDateLabel(item: PressItem): string | null {
  if (item.publishedAt) return formatLongDate(item.publishedAt)
  return item.year != null ? String(item.year) : null
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
