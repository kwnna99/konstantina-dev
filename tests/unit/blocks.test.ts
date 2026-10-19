import { describe, expect, it } from 'vitest'
import { defineComponent, h, type Component } from 'vue'
import { mount } from '@vue/test-utils'
import { blockComponents } from '../../src/blocks/registry'
import { content, DEFAULT_ORDER, type BlockId } from '../../src/content'
import { createEditor, EditorKey } from '../../src/editor/store'

function render(comp: Component) {
  const editor = createEditor()
  return mount(
    defineComponent({
      provide: { [EditorKey as symbol]: editor },
      render: () => h(comp),
    }),
  )
}
const block = (id: BlockId) => render(blockComponents[id])

describe('blocks', () => {
  it('hero: h1 name, headline, focus sentence, hiring link', () => {
    const w = block('hero')
    expect(w.find('h1').text()).toBe('Konstantina Roumelioti')
    expect(w.find('h1').attributes('id')).toBe('heading-hero')
    expect(w.text()).toContain('I build tools for builders.')
    expect(w.text()).toContain('frontend focus')
    const a = w.find(`a[href="${content.links.jobPosting}"]`)
    expect(a.text()).toContain('My team is hiring')
    expect(a.attributes('rel')).toBe('noopener')
  })

  it('every non-hero block has an h2 with a heading id', () => {
    const titles: Record<string, string> = {
      now: 'What I do now', stack: 'Stack', how: 'How I work', languages: 'Languages',
      career: 'How I got here', offclock: 'Off the clock', contact: 'Say hi',
    }
    for (const [id, title] of Object.entries(titles)) {
      const h2 = block(id as BlockId).find('h2')
      expect(h2.text()).toBe(title)
      expect(h2.attributes('id')).toBe(`heading-${id}`)
    }
  })

  it('now: four cards', () => {
    expect(block('now').findAll('li')).toHaveLength(4)
  })

  it('stack: shows focus line and all 11 tags in order', () => {
    const w = block('stack')
    expect(w.text()).toContain('Frontend-focused, full-stack')
    expect(w.text()).not.toContain(content.stack.tagline)
    expect(w.findAll('li').map(l => l.text())).toEqual(content.stack.tags.map(t => t.name))
    expect(w.findAll('li')).toHaveLength(11)
  })

  it('how I work: both emphasised items present', () => {
    const w = block('how')
    expect(w.findAll('li.emphasis').map(l => l.text())).toEqual([
      'Calm (happy, even) under pressure',
      'Transforming legacy code, and enjoying it',
    ])
    expect(w.text()).toContain('Calm (happy, even) under pressure')
    expect(w.text()).toContain('Transforming legacy code')
  })

  it('languages: only Greek and English', () => {
    const w = block('languages')
    expect(w.findAll('li').map(l => l.find('strong').text())).toEqual(['Greek', 'English'])
  })

  it('career: four roles then the degree, Jan 2026 – now first', () => {
    const items = block('career').findAll('li')
    expect(items).toHaveLength(5)
    expect(items[0].text()).toContain('Jan 2026 – now')
    expect(items[0].text()).toContain('LearnWorlds')
    expect(items[1].text()).toContain('Mar 2023 – Jan 2026')
    expect(items[4].text()).toContain('BSc Computer Science & Biomedical Informatics')
    expect(items[4].text()).toContain('Graduated first in class.')
  })

  it('off the clock: lead line first, links to @kona.reads, mentions EYP', () => {
    const w = block('offclock')
    expect(w.findAll('p')[0].text()).toBe("When I'm not reviewing code, I'm reviewing books.")
    const a = w.find(`a[href="${content.links.bookstagram}"]`)
    expect(a.text()).toBe('@kona.reads')
    expect(a.attributes('target')).toBe('_blank')
    expect(w.text()).toContain('European Youth Parliament')
  })

  it('contact: four links incl. View source; freelance line', () => {
    const w = block('contact')
    const links = w.findAll('a')
    expect(links.map(a => a.text())).toEqual(['GitHub', 'LinkedIn', 'Email', 'View source'])
    expect(links[2].attributes('href')).toMatch(/^mailto:/)
    expect(links[2].attributes('href')).toBe(content.links.email)
    expect(links[3].attributes('href')).toBe(content.links.source)
    expect(w.text()).toContain('Occasionally open to small freelance projects.')
  })

  it('registry covers every BlockId', () => {
    expect(Object.keys(blockComponents).sort()).toEqual([...DEFAULT_ORDER].sort())
  })

  it('exactly one h1 across all blocks', () => {
    const count = DEFAULT_ORDER.reduce((n, id) => n + block(id).findAll('h1').length, 0)
    expect(count).toBe(1)
  })
})
