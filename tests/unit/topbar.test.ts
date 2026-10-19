import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import TopBar from '../../src/components/TopBar.vue'
import { createEditor, EditorKey } from '../../src/editor/store'

function setup() {
  const editor = createEditor()
  const wrapper = mount(
    defineComponent({
      props: { announce: { type: String, default: '' } },
      provide: { [EditorKey as symbol]: editor },
      render() {
        return h(TopBar, { announce: this.announce, notice: this.announce })
      },
    }),
  )
  const live = () => wrapper.find('[role="status"]').text()
  return { wrapper, editor, live }
}

describe('TopBar live region', () => {
  it('is empty until something happens', () => {
    expect(setup().live()).toBe('')
  })

  it('clearing an announcement leaves the region empty, never the save status', async () => {
    const { wrapper, live } = setup()
    await wrapper.setProps({ announce: 'Email copied' })
    expect(live()).toBe('Email copied')
    await wrapper.setProps({ announce: '' })
    await nextTick()
    expect(live()).toBe('')
    expect(live()).not.toContain('All changes saved')
  })

  it('announces save-status changes', async () => {
    const { editor, live } = setup()
    editor.moveBy('now', 1)
    await nextTick()
    expect(live()).toBe('Saving…')
  })
})

describe('TopBar colours', () => {
  it('uses tokens, not hard-coded colours, for the primary button', async () => {
    const src = (await import('../../src/components/TopBar.vue?raw')).default
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
