import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import EditableText from '../../src/components/EditableText.vue'
import { createEditor, EditorKey, type Editor } from '../../src/editor/store'

function setup(original = 'Orig') {
  const editor = createEditor()
  const Host = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
    provide: { [EditorKey as symbol]: editor },
  })
  const wrapper = mount(
    defineComponent({
      render: () =>
        h(Host, null, {
          default: () => h(EditableText, { textKey: 'k', original, as: 'h2' }),
        }),
    }),
    { attachTo: document.body },
  )
  return { wrapper, editor }
}

async function startEdit(wrapper: ReturnType<typeof setup>['wrapper']) {
  await wrapper.find('h2').trigger('dblclick')
  await nextTick()
  return wrapper.find('h2')
}

afterEach(() => {
  delete document.documentElement.dataset.mode
  document.body.innerHTML = ''
})

describe('EditableText', () => {
  it('renders the original', () => {
    const { wrapper } = setup()
    expect(wrapper.find('h2').text()).toBe('Orig')
  })

  it('dblclick → edit, Enter commits trimmed text, no newline', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    expect(el.attributes('contenteditable')).toBeDefined()
    expect(editor.editingKey.value).toBe('k')
    el.element.textContent = '  New '
    await el.trigger('keydown', { key: 'Enter' })
    await nextTick()
    const after = wrapper.find('h2')
    expect(after.text()).toBe('New')
    expect(after.text()).not.toContain('\n')
    expect(editor.canUndo.value).toBe(true)
    expect(after.attributes('contenteditable')).toBeUndefined()
    expect(editor.editingKey.value).toBeNull()
  })

  it('Esc cancels', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    el.element.textContent = 'X'
    await el.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('h2').text()).toBe('Orig')
    expect(editor.canUndo.value).toBe(false)
    expect(editor.editingKey.value).toBeNull()
  })

  it('empty commit reverts to original', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    el.element.textContent = '  '
    await el.trigger('blur')
    await nextTick()
    expect(wrapper.find('h2').text()).toBe('Orig')
    expect(editor.canUndo.value).toBe(false)
  })

  it('unchanged commit adds no history', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    await el.trigger('blur')
    await nextTick()
    expect(editor.canUndo.value).toBe(false)
    expect(wrapper.find('h2').attributes('contenteditable')).toBeUndefined()
  })

  it('paste inserts plain single-line text', async () => {
    const { wrapper } = setup()
    const el = await startEdit(wrapper)
    el.element.textContent = ''
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as Event & {
      clipboardData: { getData(t: string): string }
    }
    ev.clipboardData = {
      getData: (t: string) => (t === 'text/plain' ? 'a\nb' : '<b>x</b>'),
    }
    el.element.dispatchEvent(ev)
    await nextTick()
    expect(el.element.textContent).toContain('a b')
    expect(el.element.innerHTML).not.toContain('<b>')
    expect(ev.defaultPrevented).toBe(true)
  })

  it('does not enter edit mode in preview', async () => {
    document.documentElement.dataset.mode = 'preview'
    const { wrapper, editor } = setup()
    await wrapper.find('h2').trigger('dblclick')
    await nextTick()
    expect(wrapper.find('h2').attributes('contenteditable')).toBeUndefined()
    expect(editor.editingKey.value).toBeNull()
  })

  it('leaves edit mode without committing when the editor resets', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    el.element.textContent = 'Changed'
    editor.reset()
    await nextTick()
    const after = wrapper.find('h2')
    expect(after.attributes('contenteditable')).toBeUndefined()
    expect(after.text()).toBe('Orig')
    expect(editor.canUndo.value).toBe(false)
  })

  it('Enter during IME composition does not commit', async () => {
    const { wrapper, editor } = setup()
    const el = await startEdit(wrapper)
    el.element.textContent = 'ni'
    const ev = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })
    el.element.dispatchEvent(ev)
    await nextTick()
    expect(wrapper.find('h2').attributes('contenteditable')).toBeDefined()
    expect(editor.editingKey.value).toBe('k')
    expect(ev.defaultPrevented).toBe(false)
  })

  it('leaves edit mode when another field starts editing', async () => {
    const { wrapper, editor } = setup()
    await startEdit(wrapper)
    editor.editingKey.value = 'other'
    await nextTick()
    expect(wrapper.find('h2').attributes('contenteditable')).toBeUndefined()
    expect(editor.canUndo.value).toBe(false)
  })
})

describe('EditableText focus return', () => {
  function frame(original = 'Orig') {
    const editor = createEditor()
    const wrapper = mount(
      defineComponent({
        provide: { [EditorKey as symbol]: editor },
        render: () =>
          h('div', { class: 'blk', tabindex: 0 }, [h(EditableText, { textKey: 'k', original, as: 'h2' })]),
      }),
      { attachTo: document.body },
    )
    return { wrapper, editor }
  }

  it('returns focus to the enclosing block after Enter', async () => {
    const { wrapper } = frame()
    const el = await startEdit(wrapper)
    el.element.textContent = 'New'
    await el.trigger('keydown', { key: 'Enter' })
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('.blk').element)
  })

  it('returns focus to the enclosing block after Esc', async () => {
    const { wrapper } = frame()
    const el = await startEdit(wrapper)
    await el.trigger('keydown', { key: 'Escape' })
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('.blk').element)
  })

  it('returns focus to the enclosing block after an external reset', async () => {
    const { wrapper, editor } = frame()
    await startEdit(wrapper)
    editor.reset()
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.find('.blk').element)
  })

  it('does not steal focus when the edit ends by blur', async () => {
    const { wrapper } = frame()
    const outside = document.createElement('button')
    document.body.append(outside)
    const el = await startEdit(wrapper)
    outside.focus()
    await el.trigger('blur')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(outside)
  })
})

export type { Editor }
