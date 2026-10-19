import { computed, inject, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { DEFAULT_ORDER, type BlockId } from '../content'

export type SaveStatus = 'saved' | 'saving' | 'kidding'

export interface Editor {
  order: Readonly<Ref<BlockId[]>>
  selected: Readonly<Ref<BlockId | null>>
  /** Set by EditableText while a text is being edited. */
  editingKey: Ref<string | null>
  status: Readonly<Ref<SaveStatus>>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  /** True when the order or any text differs from the default. */
  isDirty: ComputedRef<boolean>
  /** Selection is not a history entry. */
  select(id: BlockId | null): void
  /** Returns false when the move is a no-op. */
  move(id: BlockId, toIndex: number): boolean
  moveBy(id: BlockId, delta: -1 | 1): boolean
  /** The edited text for `key`, or `original` when there is no override. */
  textFor(key: string, original: string): string
  /** Value is trimmed; empty reverts to `original`; returns false when nothing changed. */
  setText(key: string, value: string, original: string): boolean
  undo(): boolean
  redo(): boolean
  /** Restores defaults and clears history. */
  reset(): void
}

interface Snapshot {
  order: BlockId[]
  texts: Record<string, string>
}

const SAVING_MS = 600
const KIDDING_MS = 4000

function sameOrder(a: readonly BlockId[], b: readonly BlockId[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

export function createEditor(initial: BlockId[] = DEFAULT_ORDER): Editor {
  const defaultOrder: BlockId[] = [...initial]

  const order = ref<BlockId[]>([...defaultOrder])
  const texts = ref<Record<string, string>>({})
  const selected = ref<BlockId | null>(null)
  const editingKey = ref<string | null>(null)
  const status = ref<SaveStatus>('saved')

  // history[cursor] is the current state; entries after cursor are redo.
  const history = ref<Snapshot[]>([{ order: [...defaultOrder], texts: {} }])
  const cursor = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function touchStatus() {
    clearTimer()
    status.value = 'saving'
    timer = setTimeout(() => {
      status.value = 'kidding'
      timer = setTimeout(() => {
        status.value = 'saved'
        timer = null
      }, KIDDING_MS)
    }, SAVING_MS)
  }

  function commit() {
    history.value = [
      ...history.value.slice(0, cursor.value + 1),
      { order: [...order.value], texts: { ...texts.value } },
    ]
    cursor.value = history.value.length - 1
    touchStatus()
  }

  function restore(index: number) {
    const snap = history.value[index]!
    cursor.value = index
    order.value = [...snap.order]
    texts.value = { ...snap.texts }
    touchStatus()
  }

  function select(id: BlockId | null) {
    selected.value = id
  }

  function move(id: BlockId, toIndex: number): boolean {
    const from = order.value.indexOf(id)
    if (from === -1) return false
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= order.value.length) return false
    if (from === toIndex) return false
    const next = [...order.value]
    next.splice(from, 1)
    next.splice(toIndex, 0, id)
    order.value = next
    commit()
    return true
  }

  function moveBy(id: BlockId, delta: -1 | 1): boolean {
    const from = order.value.indexOf(id)
    if (from === -1) return false
    return move(id, from + delta)
  }

  function textFor(key: string, original: string): string {
    return texts.value[key] ?? original
  }

  function setText(key: string, value: string, original: string): boolean {
    const trimmed = value.trim()
    const next = trimmed === '' ? original : trimmed
    if (next === textFor(key, original)) return false
    const copy = { ...texts.value }
    if (next === original) delete copy[key]
    else copy[key] = next
    texts.value = copy
    commit()
    return true
  }

  function undo(): boolean {
    if (cursor.value === 0) return false
    restore(cursor.value - 1)
    return true
  }

  function redo(): boolean {
    if (cursor.value >= history.value.length - 1) return false
    restore(cursor.value + 1)
    return true
  }

  function reset() {
    clearTimer()
    order.value = [...defaultOrder]
    texts.value = {}
    selected.value = null
    editingKey.value = null
    history.value = [{ order: [...defaultOrder], texts: {} }]
    cursor.value = 0
    status.value = 'saved'
  }

  return {
    order,
    selected,
    editingKey,
    status,
    canUndo: computed(() => cursor.value > 0),
    canRedo: computed(() => cursor.value < history.value.length - 1),
    isDirty: computed(
      () => !sameOrder(order.value, defaultOrder) || Object.keys(texts.value).length > 0,
    ),
    select,
    move,
    moveBy,
    textFor,
    setText,
    undo,
    redo,
    reset,
  }
}

export const EditorKey: InjectionKey<Editor> = Symbol('editor')

export function useEditor(): Editor {
  const editor = inject(EditorKey, null)
  if (!editor) throw new Error('useEditor() called without a provided editor')
  return editor
}
