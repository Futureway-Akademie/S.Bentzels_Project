// Eintrag der Vita: Prüfung und Umwandlung (reine Funktionen, ohne Imports).

export type VitaCategory =
  'ausbildung' | 'ausstellung' | 'messe' | 'kuratorisch'

export const VITA_CATEGORIES: VitaCategory[] = [
  'ausbildung',
  'ausstellung',
  'messe',
  'kuratorisch',
]

export type VitaFormValues = {
  year: string
  year_end: string
  category: VitaCategory
  title_de: string
  place: string
  is_published: boolean
}

export type VitaFormErrorCode =
  | 'required'
  | 'yearInvalid'
  | 'yearEndInvalid'
  | 'yearEndBeforeStart'
  | 'tooLong'
export type VitaFormErrors = Partial<
  Record<'year' | 'year_end' | 'title_de' | 'place', VitaFormErrorCode>
>

export type VitaPayload = {
  year: number
  year_end: number | null
  category: VitaCategory
  title_de: string
  place: string | null
  is_published: boolean
}

const validYear = (value: string) =>
  /^\d{4}$/.test(value) && Number(value) >= 1000 && Number(value) <= 2999

export function emptyVitaForm(category: VitaCategory): VitaFormValues {
  return {
    year: '',
    year_end: '',
    category,
    title_de: '',
    place: '',
    is_published: true,
  }
}

export function validateVitaForm(values: VitaFormValues): VitaFormErrors {
  const errors: VitaFormErrors = {}
  const year = values.year.trim()
  const yearEnd = values.year_end.trim()
  if (year === '') errors.year = 'required'
  else if (!validYear(year)) errors.year = 'yearInvalid'

  if (yearEnd !== '') {
    if (!validYear(yearEnd)) errors.year_end = 'yearEndInvalid'
    else if (!errors.year && Number(yearEnd) < Number(year))
      errors.year_end = 'yearEndBeforeStart'
  }

  const title = values.title_de.trim()
  if (title === '') errors.title_de = 'required'
  else if (title.length > 200) errors.title_de = 'tooLong'
  if (values.place.trim().length > 200) errors.place = 'tooLong'
  return errors
}

/** Nur nach erfolgreicher Prüfung. */
export function toVitaPayload(values: VitaFormValues): VitaPayload {
  return {
    year: Number(values.year.trim()),
    year_end:
      values.year_end.trim() === '' ? null : Number(values.year_end.trim()),
    category: values.category,
    title_de: values.title_de.trim(),
    place: values.place.trim() === '' ? null : values.place.trim(),
    is_published: values.is_published,
  }
}

export function vitaFormFromRow(row: {
  year: number
  year_end: number | null
  category: VitaCategory
  title_de: string
  place: string | null
  is_published: boolean
}): VitaFormValues {
  return {
    year: String(row.year),
    year_end: row.year_end == null ? '' : String(row.year_end),
    category: row.category,
    title_de: row.title_de,
    place: row.place ?? '',
    is_published: row.is_published,
  }
}

/** Sortierung innerhalb einer Kategorie: neueste zuerst, bei gleichem Jahr nach Position. */
export function sortVita<T extends { year: number; sort_order: number }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort(
    (a, b) => b.year - a.year || a.sort_order - b.sort_order,
  )
}
