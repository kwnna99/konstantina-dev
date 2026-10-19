import { expect, test, type Page } from '@playwright/test'
import { waitForApp } from './helpers.ts'

const isNarrow = (page: Page) => page.viewportSize()!.width < 1024
const palette = (page: Page) => page.getByRole('dialog', { name: 'Command palette' })
const combo = (page: Page) => page.getByRole('combobox')

/** The platform's command modifier, matching the app's own detection. */
async function mod(page: Page) {
  const mac = await page.evaluate(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    return /Mac|iPhone|iPad/.test(nav.userAgentData?.platform ?? nav.platform ?? '')
  })
  return mac ? 'Meta' : 'Control'
}
async function openPalette(page: Page) {
  await page.keyboard.press(`${await mod(page)}+k`)
}

async function ready(page: Page, url = '/') {
  await page.goto(url)
  await waitForApp(page)
  await expect(page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeVisible()
  if (isNarrow(page) && !url.includes('preview')) {
    await page.getByRole('button', { name: /Open in editor/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'editor')
  }
}

test('opens with the shortcut, runs a command, closes with Escape and returns focus', async ({ page }) => {
  await ready(page)
  const theme = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })
  await theme.focus()
  const before = await page.locator('html').getAttribute('data-theme')

  await openPalette(page)
  await expect(palette(page)).toBeVisible()
  await expect(combo(page)).toBeFocused()

  await combo(page).fill('theme')
  await expect(palette(page).getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Enter')
  await expect(palette(page)).toBeHidden()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before!)
  await expect(theme).toBeFocused()

  await openPalette(page)
  await expect(palette(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette(page)).toBeHidden()
  await expect(theme).toBeFocused()
})

test('arrow keys wrap and move aria-activedescendant; Tab stays inside', async ({ page }) => {
  await ready(page)
  await openPalette(page)
  await expect(palette(page)).toBeVisible()
  const first = await combo(page).getAttribute('aria-activedescendant')
  expect(first).toBe('palette-opt-0')
  await page.keyboard.press('ArrowUp')
  const last = await combo(page).getAttribute('aria-activedescendant')
  const count = await palette(page).getByRole('option').count()
  expect(last).toBe(`palette-opt-${count - 1}`)
  await page.keyboard.press('ArrowDown')
  await expect(combo(page)).toHaveAttribute('aria-activedescendant', 'palette-opt-0')
  await page.keyboard.press('Tab')
  await expect(combo(page)).toBeFocused()
})

test('undo shortcut typed into the input does not undo the editor', async ({ page }) => {
  test.skip(isNarrow(page), 'needs the layers panel')
  await ready(page)
  const order = () => page.locator('.page > .blk > section').evaluateAll((els) => els.map((el) => el.id))
  await page.locator('.layers').getByRole('option', { name: /Contact/ }).click()
  await page.keyboard.press('Alt+ArrowUp')
  const start = await order()
  expect(start[start.length - 1]).not.toBe('block-contact')
  await openPalette(page)
  await combo(page).pressSequentially('abc')
  // The app must leave the key to the input: the event is not default-prevented.
  await page.evaluate(() => {
    ;(window as any).__prevented = null
    window.addEventListener('keydown', (e) => ((window as any).__prevented = e.defaultPrevented))
  })
  await page.keyboard.press(`${await mod(page)}+z`)
  expect(await page.evaluate(() => (window as any).__prevented)).toBe(false)
  expect(await order()).toEqual(start)
  await expect(palette(page)).toBeVisible()
  await expect(combo(page)).toBeFocused()
})

test('backdrop click closes; shortcut also works in preview', async ({ page }) => {
  test.skip(isNarrow(page), 'desktop preview')
  await ready(page, '/?preview')
  await openPalette(page)
  await expect(palette(page)).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(palette(page)).toBeHidden()
})

test('copy email shows a notice in the status region', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  await ready(page)
  await openPalette(page)
  await combo(page).fill('copy email')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText(/Email copied|Couldn't copy/)
})

test('notice is announced through a live region in preview', async ({ page }) => {
  await ready(page, '/?preview')
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'preview')
  await openPalette(page)
  await combo(page).fill('reset page')
  await page.keyboard.press('Enter')
  const status = page.getByRole('status')
  await expect(status).toHaveText('Page reset')
  expect(await status.evaluate((el) => getComputedStyle(el).display)).not.toBe('none')
})
