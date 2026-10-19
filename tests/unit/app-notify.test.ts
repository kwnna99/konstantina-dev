import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from '../../src/App.vue'

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('App notify', () => {
  it('empties the live region before repeating an identical notice', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const wrapper = mount(App, { global: { plugins: [createHead()] }, attachTo: document.body })
    await flushPromises()
    const live = () => document.querySelector('[role="status"]')!.textContent!.trim()

    // Record every distinct state of the live region while the notice is repeated.
    const seen: string[] = []
    const observer = new MutationObserver(() => seen.push(live()))
    observer.observe(document.querySelector('[role="status"]')!, { childList: true, characterData: true, subtree: true })

    async function copyEmail() {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
      await nextTick()
      const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!
      input.value = 'copy email'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await flushPromises()
      await new Promise((r) => setTimeout(r, 0))
    }

    await copyEmail()
    expect(live()).toBe('Email copied')
    seen.length = 0
    await copyEmail()
    await new Promise((r) => setTimeout(r, 0))

    expect(live()).toBe('Email copied')
    expect(seen).toContain('')
    expect(seen.indexOf('')).toBeLessThan(seen.lastIndexOf('Email copied'))
    expect(seen.some((t) => t.includes('All changes saved'))).toBe(false)
    observer.disconnect()
    wrapper.unmount()
  })
})
