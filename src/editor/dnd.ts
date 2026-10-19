import { ref, type Ref } from 'vue'
import type { BlockId } from '../content'

/** Index to insert at (0..midpoints.length) for a pointer at `y`. */
export function dropIndex(midpoints: number[], y: number): number {
  let index = 0
  for (const mid of midpoints) {
    if (y > mid) index++
    else break
  }
  return index
}

export interface DragReorderOptions {
  /** Rects of the items, in list order. */
  getRects(): DOMRect[]
  /** Receives the final index (after the dragged item is removed). */
  onDrop(id: BlockId, toIndex: number): void
  /** Current index of an item; falls back to the rect under the pointer at drag start. */
  indexOf?(id: BlockId): number
}

export interface DragReorder {
  onDragStart(id: BlockId, e: DragEvent): void
  onDragOver(e: DragEvent): void
  onDrop(e: DragEvent): void
  onDragEnd(): void
  indicatorIndex: Ref<number | null>
}

function insertIndexAt(rects: DOMRect[], y: number): number {
  return dropIndex(
    rects.map((r) => r.top + r.height / 2),
    y,
  )
}

export function useDragReorder(opts: DragReorderOptions): DragReorder {
  const indicatorIndex = ref<number | null>(null)
  let dragId: BlockId | null = null
  let fromIndex = -1

  function onDragStart(id: BlockId, e: DragEvent) {
    dragId = id
    const rects = opts.getRects()
    fromIndex = opts.indexOf
      ? opts.indexOf(id)
      : rects.findIndex((r) => e.clientY >= r.top && e.clientY <= r.bottom)
    if (e.dataTransfer) {
      // Firefox needs data to be set for a drag to start.
      e.dataTransfer.setData('text/plain', id)
      e.dataTransfer.effectAllowed = 'move'
      const row = (e.currentTarget as Element | null)?.closest?.('.blk, .layer')
      if (row && typeof e.dataTransfer.setDragImage === 'function') {
        e.dataTransfer.setDragImage(row, 16, 16)
      }
    }
  }

  function onDragOver(e: DragEvent) {
    if (dragId === null) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    indicatorIndex.value = insertIndexAt(opts.getRects(), e.clientY)
  }

  function onDrop(e: DragEvent) {
    if (dragId === null) return
    e.preventDefault()
    const id = dragId
    const from = fromIndex
    const insertAt = insertIndexAt(opts.getRects(), e.clientY)
    reset()
    if (from < 0) return
    opts.onDrop(id, insertAt > from ? insertAt - 1 : insertAt)
  }

  function reset() {
    dragId = null
    fromIndex = -1
    indicatorIndex.value = null
  }

  /** Fires after drop too; a dragend without a drop does nothing. */
  function onDragEnd() {
    reset()
  }

  return { onDragStart, onDragOver, onDrop, onDragEnd, indicatorIndex }
}
