import { expect, it } from 'vitest'
import { content } from '../../src/content'

it('has the eight blocks in the default order', () =>
  expect(content.blocks.map(b => b.id)).toEqual(['hero','now','stack','how','languages','career','offclock','contact']))
it('labels blocks with their display names', () =>
  expect(content.blocks.map(b => b.label)).toEqual(['Hero','Now','Stack','How I work','Languages','Career','Off the clock','Contact']))
it('uses the exact fixed copy', () => {
  expect(content.identity.headline).toBe('I build tools for builders.')
  expect(content.offClock.leadLine).toBe("When I'm not reviewing code, I'm reviewing books.")
  expect(content.contact.freelanceLine).toBe('Occasionally open to small freelance projects.')
  expect(content.identity.intro).toContain("I'm a full-stack engineer with a frontend focus.")
})
it('lists the career exactly', () =>
  expect(content.career.map(r => [r.title, r.start, r.end])).toEqual([
    ['Technical Lead, Authoring Tools','Jan 2026',null],
    ['Full Stack Engineer','Mar 2023','Jan 2026'],
    ['QA Engineer','Aug 2021','May 2023'],
    ['Customer Support','Apr 2021','Aug 2021']]))
it('career is LearnWorlds-only (allowlist)', () => {
  expect(new Set(content.career.map(r => r.org))).toEqual(new Set(['LearnWorlds']))
  expect(content.career.map(r => r.title)).toEqual(['Technical Lead, Authoring Tools','Full Stack Engineer','QA Engineer','Customer Support'])
})
it('has no hire-me language', () => expect(JSON.stringify(content).toLowerCase()).not.toContain('hire me'))
it('has only Greek and English', () =>
  expect(content.languages).toEqual([{ name: 'Greek', level: 'Native' }, { name: 'English', level: 'Full professional' }]))
it('has inspector properties for every block, with the hire_me_banners easter egg', () => {
  for (const b of content.blocks) expect(b.properties.length).toBeGreaterThan(0)
  expect(content.blocks.find(b => b.id === 'contact')!.properties).toContainEqual(['hire_me_banners','0'])
})
it('links are absolute https or mailto', () => {
  for (const [k, v] of Object.entries(content.links)) if (k !== 'bookstagramHandle') expect(v).toMatch(/^(https:\/\/|mailto:)/)
})
