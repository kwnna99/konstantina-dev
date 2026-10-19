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

describe('App selection announcement', () => {
  it('announces "{Label} block selected" when the selected block changes, and nothing on deselect', async () => {
    const wrapper = mount(App, { global: { plugins: [createHead()] }, attachTo: document.body })
    await flushPromises()
    const status = document.querySelector('[role="status"]')!
    const live = () => status.textContent!.trim()
    const seen: string[] = []
    const observer = new MutationObserver(() => seen.push(live()))
    observer.observe(status, { childList: true, characterData: true, subtree: true })

    document.querySelector<HTMLElement>('#block-stack')!.click()
    await flushPromises()
    expect(live()).toBe('Stack block selected')

    document.querySelector<HTMLElement>('#block-contact')!.click()
    await flushPromises()
    expect(live()).toBe('Contact block selected')

    seen.length = 0
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.querySelector('.blk.sel')).toBeNull()
    // Deselecting says nothing new.
    expect(seen.filter((t) => t !== '' && t !== 'Contact block selected')).toEqual([])
    observer.disconnect()
    wrapper.unmount()
  })
})
