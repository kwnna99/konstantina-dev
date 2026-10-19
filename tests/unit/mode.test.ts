import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import type * as ModeModule from '../../src/editor/mode'

type Listener = (e: { matches: boolean }) => void

/** A controllable stand-in for the narrow-screen media query. */
function stubMatchMedia(initiallyNarrow: boolean) {
  const listeners: Listener[] = []
  const mql = {
    matches: initiallyNarrow,
    addEventListener: (_: string, fn: Listener) => listeners.push(fn),
    removeEventListener: () => {},
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    resize(narrow: boolean) {
      mql.matches = narrow
      listeners.forEach((fn) => fn({ matches: narrow }))
    },
  }
}

let mod: typeof ModeModule

beforeEach(async () => {
  vi.resetModules()
  delete document.documentElement.dataset.mode
  history.replaceState(null, '', '/')
  mod = await import('../../src/editor/mode')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('initialMode', () => {
  it('uses the preview param or the screen width', () => {
    expect(mod.initialMode('?preview', false)).toBe('preview')
    expect(mod.initialMode('?utm=x&preview=1', false)).toBe('preview')
    expect(mod.initialMode('', true)).toBe('preview')
    expect(mod.initialMode('', false)).toBe('editor')
    expect(mod.initialMode('?previewed=1', false)).toBe('editor')
  })
})

describe('useMode', () => {
  it('reads the attribute the head script set', () => {
    stubMatchMedia(false)
    document.documentElement.dataset.mode = 'preview'
    const { mode } = mod.useMode()
    expect(mode.value).toBe('preview')
  })

  it('setMode updates attribute and URL, preserving other params and hash', () => {
    stubMatchMedia(false)
    history.replaceState(null, '', '/?utm=x#c')
    const m = mod.useMode()
    expect(m.mode.value).toBe('editor')

    m.setMode('preview')
    expect(document.documentElement.dataset.mode).toBe('preview')
    expect(m.mode.value).toBe('preview')
    expect(location.search).toContain('utm=x')
    expect(location.search).toContain('preview')
    expect(location.hash).toBe('#c')

    m.setMode('editor')
    expect(document.documentElement.dataset.mode).toBe('editor')
    expect(location.search).toBe('?utm=x')
    expect(location.hash).toBe('#c')
  })

  it('toggle flips between the two modes', () => {
    stubMatchMedia(false)
    const m = mod.useMode()
    m.toggle()
    expect(m.mode.value).toBe('preview')
    expect(location.search).toBe('?preview')
    m.toggle()
    expect(m.mode.value).toBe('editor')
    expect(location.search).toBe('')
  })

  it('resize does not flip mode', () => {
    const media = stubMatchMedia(false)
    const m = mod.useMode()
    expect(m.mode.value).toBe('editor')
    expect(m.isNarrow.value).toBe(false)

    media.resize(true)
    expect(m.isNarrow.value).toBe(true)
    expect(m.mode.value).toBe('editor')

    m.setMode('preview')
    media.resize(false)
    expect(m.isNarrow.value).toBe(false)
    expect(m.mode.value).toBe('preview')
  })

  it('works without matchMedia', () => {
    const m = mod.useMode()
    expect(m.isNarrow.value).toBe(false)
    expect(m.mode.value).toBe('editor')
  })

  it('inside a component, waits for mount before reading the document', async () => {
    stubMatchMedia(true)
    document.documentElement.dataset.mode = 'preview'
    const seen: string[] = []
    const wrapper = mount(
      defineComponent({
        setup() {
          const { mode } = mod.useMode()
          seen.push(mode.value)
          return () => h('p', mode.value)
        },
      }),
    )
    // The first render matches the server render: editor.
    expect(seen).toEqual(['editor'])
    await nextTick()
    expect(wrapper.text()).toBe('preview')
  })
})
