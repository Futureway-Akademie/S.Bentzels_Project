// Verweisadresse aus einer Eingabe (reine Funktion, ohne Imports).

/** Ergänzt https:// bzw. mailto: und lehnt unbrauchbare Eingaben mit null ab. */
export function normalizeLinkUrl(input: string): string | null {
  const value = input.trim()
  if (value === '' || /\s/.test(value)) return null
  if (/^(https?:\/\/|mailto:|tel:)\S+$/i.test(value)) return value
  if (/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(value)) return `mailto:${value}`
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`
  return null
}
