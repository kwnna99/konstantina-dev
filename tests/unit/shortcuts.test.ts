import { describe, expect, it } from 'vitest'
import { resolveShortcut, type KeyLike } from '../../src/editor/shortcuts'

const k = (key: string, mods: Partial<KeyLike> = {}): KeyLike => ({
  key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
})
const base = { isMac: true, editingText: false, paletteOpen: false, hasSelection: true }
const pc = { ...base, isMac: false }

describe('resolveShortcut', () => {
  it('resolves undo and redo on Mac', () => {
    expect(resolveShortcut(k('z', { metaKey: true }), base)).toBe('undo')
    expect(resolveShortcut(k('z', { metaKey: true, shiftKey: true }), base)).toBe('redo')
    expect(resolveShortcut(k('Z', { metaKey: true, shiftKey: true }), base)).toBe('redo')
  })

  it('resolves undo and redo on other platforms', () => {
    expect(resolveShortcut(k('z', { ctrlKey: true }), pc)).toBe('undo')
    expect(resolveShortcut(k('y', { ctrlKey: true }), pc)).toBe('redo')
    expect(resolveShortcut(k('z', { ctrlKey: true, shiftKey: true }), pc)).toBe('redo')
  })

  it('ignores the wrong modifier for the platform', () => {
    expect(resolveShortcut(k('z', { ctrlKey: true }), base)).toBeNull()
    expect(resolveShortcut(k('z', { metaKey: true }), pc)).toBeNull()
  })

  it('opens the palette', () => {
    expect(resolveShortcut(k('k', { metaKey: true }), base)).toBe('palette')
    expect(resolveShortcut(k('K', { ctrlKey: true }), pc)).toBe('palette')
  })

  it('moves the selection with Alt+Arrow', () => {
    expect(resolveShortcut(k('ArrowUp', { altKey: true }), base)).toBe('moveUp')
    expect(resolveShortcut(k('ArrowDown', { altKey: true }), base)).toBe('moveDown')
    expect(resolveShortcut(k('ArrowUp', { altKey: true }), { ...base, hasSelection: false })).toBeNull()
    expect(resolveShortcut(k('ArrowUp', { altKey: true, metaKey: true }), base)).toBeNull()
    expect(resolveShortcut(k('ArrowDown', { altKey: true, ctrlKey: true }), pc)).toBeNull()
  })

  it('resolves Escape', () => {
    expect(resolveShortcut(k('Escape'), base)).toBe('escape')
  })

  it('only Escape is ours while typing', () => {
    for (const ctx of [
      { ...base, editingText: true },
      { ...base, paletteOpen: true },
    ]) {
      expect(resolveShortcut(k('z', { metaKey: true }), ctx)).toBeNull()
      expect(resolveShortcut(k('ArrowUp', { altKey: true }), ctx)).toBeNull()
      expect(resolveShortcut(k('Escape'), ctx)).toBe('escape')
    }
  })

  it('the palette shortcut toggles it closed', () => {
    expect(resolveShortcut(k('k', { metaKey: true }), { ...base, paletteOpen: true })).toBe('palette')
  })

  it('returns null for unrelated keys', () => {
    expect(resolveShortcut(k('a'), base)).toBeNull()
  })
})
