import { useState, type DragEvent } from 'react'
import { moveBefore } from './order'

/**
 * Sortieren per Ziehen und Ablegen für Listen mit Einträgen mit `id`. Auf Touchgeräten und per
 * Tastatur dienen zusätzliche Knöpfe „Nach oben/unten“ (siehe `moveItem` in order.ts).
 */
export function useDragSort<T extends { id: string }>(
  rows: readonly T[],
  onReorder: (next: T[]) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const reset = () => {
    setDragId(null)
    setOverId(null)
  }

  const itemProps = (id: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      setDragId(id)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
    },
    onDragEnd: reset,
    onDragOver: (event: DragEvent) => {
      if (!dragId) return
      event.preventDefault()
      setOverId(id)
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      if (dragId && dragId !== id) onReorder(moveBefore(rows, dragId, id))
      reset()
    },
  })

  return { dragId, overId, itemProps }
}
