import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ORDER } from '../../src/content'
import { createEditor } from '../../src/editor/store'

afterEach(() => {
  vi.useRealTimers()
})

describe('createEditor', () => {
  it('starts at default order, nothing selected, clean', () => {
    const e = createEditor()
    expect(e.order.value).toEqual(DEFAULT_ORDER)
    expect(e.selected.value).toBeNull()
    expect(e.canUndo.value).toBe(false)
  })

  it('moves and undoes/redoes', () => {
    const e = createEditor()
    expect(e.move('contact', 0)).toBe(true)
    expect(e.order.value[0]).toBe('contact')
    e.undo()
    expect(e.order.value).toEqual(DEFAULT_ORDER)
    e.redo()
    expect(e.order.value[0]).toBe('contact')
  })

  it('treats edge moves and same-place moves as no-ops', () => {
    const e = createEditor()
    expect(e.moveBy('hero', -1)).toBe(false)
    expect(e.moveBy('contact', 1)).toBe(false)
    expect(e.move('now', 1)).toBe(false)
    expect(e.move('now', 99)).toBe(false)
    expect(e.canUndo.value).toBe(false)
  })

  it('a no-op does not clear redo', () => {
    const e = createEditor()
    e.moveBy('now', 1)
    e.undo()
    e.moveBy('hero', -1)
    expect(e.canRedo.value).toBe(true)
  })

  it('a new change after undo clears redo', () => {
    const e = createEditor()
    e.moveBy('now', 1)
    e.undo()
    e.moveBy('stack', 1)
    expect(e.canRedo.value).toBe(false)
  })

  it('setText trims, reverts on empty, ignores unchanged', () => {
    const e = createEditor()
    expect(e.setText('hero.headline', '  Hi  ', 'Orig')).toBe(true)
    expect(e.textFor('hero.headline', 'Orig')).toBe('Hi')
    expect(e.setText('hero.headline', '   ', 'Orig')).toBe(true)
    expect(e.textFor('hero.headline', 'Orig')).toBe('Orig')
    expect(e.setText('hero.headline', 'Orig', 'Orig')).toBe(false)
  })

  it('keeps isDirty accurate when text is set back to the original', () => {
    const e = createEditor()
    e.setText('k', 'x', 'o')
    expect(e.isDirty.value).toBe(true)
    e.setText('k', 'o', 'o')
    expect(e.isDirty.value).toBe(false)
  })

  it('selection is not history', () => {
    const e = createEditor()
    e.select('stack')
    expect(e.selected.value).toBe('stack')
    expect(e.canUndo.value).toBe(false)
  })

  it('reset restores defaults and clears history', () => {
    const e = createEditor()
    e.moveBy('now', 1)
    e.setText('k', 'x', 'o')
    e.reset()
    expect(e.order.value).toEqual(DEFAULT_ORDER)
    expect(e.textFor('k', 'o')).toBe('o')
    expect(e.canUndo.value).toBe(false)
    expect(e.isDirty.value).toBe(false)
  })

  it('does not share state between instances', () => {
    const a = createEditor()
    const b = createEditor()
    a.moveBy('now', 1)
    expect(b.order.value).toEqual(DEFAULT_ORDER)
    expect(b.canUndo.value).toBe(false)
  })

  it('status goes saving → kidding → saved', () => {
    vi.useFakeTimers()
    const e = createEditor()
    e.moveBy('now', 1)
    expect(e.status.value).toBe('saving')
    vi.advanceTimersByTime(600)
    expect(e.status.value).toBe('kidding')
    vi.advanceTimersByTime(4000)
    expect(e.status.value).toBe('saved')
  })

  it('a new mutation restarts the status sequence', () => {
    vi.useFakeTimers()
    const e = createEditor()
    e.moveBy('now', 1)
    vi.advanceTimersByTime(600)
    expect(e.status.value).toBe('kidding')
    e.moveBy('stack', 1)
    expect(e.status.value).toBe('saving')
    vi.advanceTimersByTime(600)
    expect(e.status.value).toBe('kidding')
    vi.advanceTimersByTime(3999)
    expect(e.status.value).toBe('kidding')
    vi.advanceTimersByTime(1)
    expect(e.status.value).toBe('saved')
  })
})
