import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import BlockFrame from '../../src/components/BlockFrame.vue'
import EditableText from '../../src/components/EditableText.vue'
import { createEditor, EditorKey } from '../../src/editor/store'
import type { BlockMeta } from '../../src/content'

const meta = {
  id: 'how',
  label: 'How I work',
  layerIcon: '',
  description: '',
  properties: [],
} as unknown as BlockMeta

function setup(slot?: () => unknown) {
  const editor = createEditor()
  const wrapper = mount(
    defineComponent({
      provide: { [EditorKey as symbol]: editor },
      render: () =>
        h(BlockFrame, { meta, index: 0 }, { default: slot ?? (() => h('p', 'body')) }),
    }),
  )
  return { wrapper, editor }
}

describe('BlockFrame', () => {
  it('click selects and sets aria-selected', async () => {
    const { wrapper, editor } = setup()
    const blk = wrapper.find('.blk')
    expect(blk.attributes('aria-selected')).toBe('false')
    await blk.trigger('click')
    expect(editor.selected.value).toBe('how')
    expect(blk.attributes('aria-selected')).toBe('true')
    expect(blk.classes()).toContain('sel')
  })

  it('Enter key selects', async () => {
    const { wrapper, editor } = setup()
    await wrapper.find('.blk').trigger('keydown', { key: 'Enter' })
    expect(editor.selected.value).toBe('how')
  })

  it('Space key selects', async () => {
    const { wrapper, editor } = setup()
    await wrapper.find('.blk').trigger('keydown', { key: ' ' })
    expect(editor.selected.value).toBe('how')
  })

  it('shows "<Label> block" label and a labelled drag handle', () => {
    const { wrapper } = setup()
    const blk = wrapper.find('.blk')
    expect(blk.attributes('tabindex')).toBe('0')
    expect(blk.attributes('role')).toBe('option')
    expect(blk.attributes('aria-label')).toBe('How I work block')
    expect(wrapper.find('.tagl').text()).toBe('How I work block')
    expect(wrapper.find('.tagl').attributes('aria-hidden')).toBe('true')
    const handle = wrapper.find('button.handle')
    expect(handle.attributes('aria-label')).toBe('Drag How I work block')
    expect(handle.attributes('draggable')).toBe('true')
    expect(wrapper.find('section#block-how').exists()).toBe(true)
    expect(wrapper.find('section').attributes('aria-labelledby')).toBeUndefined()
  })

  it('emits dragstart-block from the handle', async () => {
    const { wrapper } = setup()
    const handle = wrapper.find('button.handle')
    await handle.trigger('dragstart')
    const frame = wrapper.findComponent(BlockFrame)
    const ev = frame.emitted('dragstart-block')!
    expect(ev[0]![0]).toBe('how')
  })

  it('does not select when a click lands inside an editing text', async () => {
    const { wrapper, editor } = setup(() => h(EditableText, { textKey: 'k', original: 'Orig', as: 'h2' }))
    await wrapper.find('h2').trigger('dblclick')
    await wrapper.find('h2').trigger('click')
    expect(editor.selected.value).toBeNull()
  })

  it('typing Space inside an editing text is not swallowed by the frame', async () => {
    const { wrapper, editor } = setup(() => h(EditableText, { textKey: 'k', original: 'Orig', as: 'h2' }))
    await wrapper.find('h2').trigger('dblclick')
    editor.select(null)
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    wrapper.find('h2').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(editor.selected.value).toBeNull()
  })
})
