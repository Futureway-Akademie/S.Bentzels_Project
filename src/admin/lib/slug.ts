// Adresse (Slug) aus dem Titel, ohne Imports (reine Funktionen).

const replacements: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  Ä: 'ae',
  Ö: 'oe',
  Ü: 'ue',
}

/** Kleinbuchstaben, Umlaute aufgelöst, alles andere zu einzelnen Bindestrichen. */
export function slugify(title: string): string {
  const text = title
    .replace(/[äöüßÄÖÜ]/g, (char) => replacements[char])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  return text
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** Liefert einen noch nicht vergebenen Slug: base, base-2, base-3 ... */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
