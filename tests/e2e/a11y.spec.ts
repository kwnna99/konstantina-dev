import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForApp } from './helpers.ts'

const isNarrow = (page: Page) => page.viewportSize()!.width < 1024
const layers = (page: Page) => page.getByRole('listbox', { name: 'Layers' }).getByRole('option')

/** The platform's command modifier, matching the app's own detection. */
async function openPalette(page: Page) {
  const mac = await page.evaluate(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    return /mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || '')
  })
  await page.keyboard.press(`${mac ? 'Meta' : 'Control'}+k`)
}

async function open(page: Page, theme: 'light' | 'dark', mode: 'editor' | 'preview') {
  await page.addInitScript((t) => localStorage.setItem('kd-theme', t), theme)
  await page.goto(mode === 'preview' ? '/?preview' : '/')
  await waitForApp(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  if (mode === 'editor' && isNarrow(page)) {
    await page.getByRole('button', { name: /Open in editor/ }).click()
  }
  await expect(page.locator('html')).toHaveAttribute('data-mode', mode)
}

async function expectNoViolations(page: Page) {
  // Axe samples colours as they are; let fades and transitions settle first. Two frames
  // first, so a transition triggered by the last interaction has started and is caught.
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
    await frame()
    await frame()
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null)))
  })
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(summary).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  for (const mode of ['editor', 'preview'] as const) {
    test(`axe: ${theme} ${mode}`, async ({ page }) => {
      await open(page, theme, mode)
      await expectNoViolations(page)
    })

    test(`axe: ${theme} ${mode} with the palette open`, async ({ page }) => {
      await open(page, theme, mode)
      await openPalette(page)
      await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
      await expectNoViolations(page)
    })
  }

  test(`axe: ${theme} editor with a block selected`, async ({ page }) => {
    await open(page, theme, 'editor')
    if (isNarrow(page)) {
      // On a phone the inspector is a bottom sheet over the canvas.
      await page.getByRole('group', { name: 'Stack block' }).click()
      await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible()
    } else {
      await layers(page).filter({ hasText: 'Stack' }).click()
    }
    await expectNoViolations(page)
  })
}

test.describe('keyboard only', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'the layers panel is a desktop surface')

  test('Tab reaches the layers, Enter selects, focus is visible, Alt+ArrowDown moves', async ({ page }) => {
    await open(page, 'light', 'editor')
    const first = layers(page).first()

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      if (await first.evaluate((el) => el === document.activeElement)) break
    }
    await expect(first).toBeFocused()
    expect(await first.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    const outline = await first.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth))
    expect(outline).toBeGreaterThan(0)

    await page.keyboard.press('Enter')
    await expect(first).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Alt+ArrowDown')
    await expect(layers(page).nth(1)).toHaveText(/Hero/)
    await expect(layers(page).first()).toHaveText(/Now/)
    // Focus stays on the moved row, not the canvas.
    await expect(layers(page).nth(1)).toBeFocused()
  })

  test('a block frame is one Tab stop: its drag handle is skipped', async ({ page }) => {
    await open(page, 'light', 'editor')
    await page.getByRole('group', { name: 'Hero block' }).focus()
    await page.keyboard.press('Tab')
    // Next stop is inside the block's own content (the hiring link), not the handle.
    await expect(page.locator('#block-hero a.pill')).toBeFocused()
    await expect(page.locator('.handle[tabindex="-1"]')).toHaveCount(8)
  })
})
