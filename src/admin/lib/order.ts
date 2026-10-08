// Reihenfolge von Listen (reine Funktionen).

export type SortUpdate = { id: string; sort_order: number }

/** Verschiebt ein Element an eine neue Position. Ungültige Angaben ändern nichts. */
export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const result = [...items]
  if (
    from < 0 ||
    from >= result.length ||
    to < 0 ||
    to >= result.length ||
    from === to
  )
    return result
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

/** Verschiebt ein Element vor das Ziel (per Ziehen und Ablegen). */
export function moveBefore<T extends { id: string }>(
  items: readonly T[],
  movedId: string,
  targetId: string,
): T[] {
  const from = items.findIndex((item) => item.id === movedId)
  const target = items.findIndex((item) => item.id === targetId)
  if (from === -1 || target === -1 || from === target) return [...items]
  const without = items.filter((item) => item.id !== movedId)
  const insertAt = without.findIndex((item) => item.id === targetId)
  without.splice(insertAt, 0, items[from])
  return without
}

/** Neue Positionen 1..n, aber nur für Einträge, deren Position sich ändert. */
export function sortUpdates(
  ordered: readonly { id: string; sort_order: number }[],
): SortUpdate[] {
  const updates: SortUpdate[] = []
  ordered.forEach((item, index) => {
    const position = index + 1
    if (item.sort_order !== position)
      updates.push({ id: item.id, sort_order: position })
  })
  return updates
}

/** Nächste freie Position am Ende. */
export function nextSortOrder(
  items: readonly { sort_order: number }[],
): number {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1
}
