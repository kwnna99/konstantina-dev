import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Inspector from '../../src/components/Inspector.vue'
import { createEditor, EditorKey } from '../../src/editor/store'

function setup(variant: 'panel' | 'sheet' = 'panel') {
  const editor = createEditor()
  const wrapper = mount(Inspector, {
    props: { variant },
    global: { provide: { [EditorKey as symbol]: editor } },
  })
  return { wrapper, editor }
}

describe('Inspector', () => {
  it('empty state hint', () => {
    const { wrapper } = setup()
    expect(wrapper.text()).toContain('Select a block to inspect it')
    expect(wrapper.attributes('aria-label')).toBe('Inspector')
  })

  it('shows contact properties incl. hire_me_banners 0', async () => {
    const { wrapper, editor } = setup()
    editor.select('contact')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('h2').text()).toBe('Contact block')
    const rows = wrapper.findAll('.prop').map((r) => r.findAll('span').map((s) => s.text()))
    expect(rows).toContainEqual(['hire_me_banners', '0'])
  })

  it('sheet variant moves the selected block', async () => {
    const { wrapper, editor } = setup('sheet')
    editor.select('now')
    await wrapper.vm.$nextTick()
    const down = wrapper.findAll('button').find((b) => b.text() === 'Move down')!
    await down.trigger('click')
    expect(editor.order.value[2]).toBe('now')
    await wrapper.find('button[aria-label="Close inspector"]').trigger('click')
    expect(editor.selected.value).toBeNull()
  })

  it('panel variant has no move buttons', async () => {
    const { wrapper, editor } = setup()
    editor.select('now')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Move down')
  })
})
