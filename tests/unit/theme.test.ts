import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ThemeModule from '../../src/editor/theme'
import type * as StorageModule from '../../src/lib/storage'

let mod: typeof ThemeModule
let storage: typeof StorageModule

beforeEach(async () => {
  vi.resetModules()
  delete document.documentElement.dataset.theme
  localStorage.clear()
  mod = await import('../../src/editor/theme')
  storage = await import('../../src/lib/storage')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('initialTheme', () => {
  it('prefers a stored choice, then the system preference', () => {
    expect(mod.initialTheme('dark', false)).toBe('dark')
    expect(mod.initialTheme('light', true)).toBe('light')
    expect(mod.initialTheme(null, true)).toBe('dark')
    expect(mod.initialTheme(null, false)).toBe('light')
    expect(mod.initialTheme('garbage', false)).toBe('light')
    expect(mod.initialTheme('garbage', true)).toBe('dark')
  })
})

describe('storage', () => {
  it('round-trips values', () => {
    storage.safeSet('k', 'v')
    expect(storage.safeGet('k')).toBe('v')
  })

  it('never throws when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => storage.safeSet('k', 'v')).not.toThrow()
    expect(storage.safeGet('k')).toBeNull()
  })
})

describe('useTheme', () => {
  it('reads the attribute the head script set', () => {
    document.documentElement.dataset.theme = 'dark'
    expect(mod.useTheme().theme.value).toBe('dark')
  })

  it('toggle writes the attribute and stores the choice', () => {
    const t = mod.useTheme()
    expect(t.theme.value).toBe('light')
    t.toggle()
    expect(t.theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('kd-theme')).toBe('dark')
    t.toggle()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('kd-theme')).toBe('light')
  })

  it('toggle works when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const t = mod.useTheme()
    expect(() => t.toggle()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
