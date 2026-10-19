import { expect, test, type Page } from '@playwright/test'

const isNarrow = (page: Page) => page.viewportSize()!.width < 1024
const html = (page: Page) => page.locator('html')
const blockOrder = (page: Page) =>
  page.locator('.page > .blk > section').evaluateAll((els) => els.map((el) => el.id))

/** Waits until the app has mounted and synced its state from the document. */
async function mounted(page: Page) {
  await expect(page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeVisible()
  await page.waitForFunction(() => document.querySelector('#app')?.hasAttribute('data-v-app'))
}

test.describe('desktop', () => {
  test.beforeEach(({ page }) => {
    test.skip(isNarrow(page), 'desktop only')
  })

  test('desktop / opens editor; ?preview opens preview; toggle round-trips URL', async ({ page }) => {
    await page.goto('/?utm=x#block-now')
    await mounted(page)
    await expect(html(page)).toHaveAttribute('data-mode', 'editor')
    await expect(page.locator('.layers')).toBeVisible()

    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(html(page)).toHaveAttribute('data-mode', 'preview')
    await expect(page.locator('.layers')).toBeHidden()
    expect(page.url()).toMatch(/\?utm=x&preview#block-now$/)

    await page.getByRole('button', { name: 'Back to editor' }).click()
    await expect(html(page)).toHaveAttribute('data-mode', 'editor')
    await expect(page.locator('.layers')).toBeVisible()
    expect(page.url()).toMatch(/\?utm=x#block-now$/)

    await page.goto('/?preview')
    await expect(html(page)).toHaveAttribute('data-mode', 'preview')
    await mounted(page)
    await expect(page.getByRole('button', { name: 'Back to editor' })).toBeVisible()
    await expect(page.locator('.layers')).toBeHidden()
  })

  test('switching to preview clears the selection and any inline edit', async ({ page }) => {
    await page.goto('/')
    await mounted(page)
    await page.locator('#block-stack').click()
    await expect(page.getByRole('option', { name: 'Stack block' })).toHaveAttribute('aria-selected', 'true')
    const headline = page.locator('#block-hero .headline')
    await headline.dblclick()
    await expect(headline).toHaveAttribute('contenteditable', /.+/)
    await page.keyboard.type('zzz')

    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(headline).not.toHaveAttribute('contenteditable', /.*/)
    // Clicking the button blurs the text first, which commits it like any other click away.
    await expect(headline).toHaveText('zzz')

    await page.getByRole('button', { name: 'Back to editor' }).click()
    await expect(page.getByRole('option', { name: 'Stack block' })).toHaveAttribute('aria-selected', 'false')
  })

  test('desktop preview hides outlines and handles', async ({ page }) => {
    await page.goto('/?preview')
    await mounted(page)
    const hero = page.locator('.blk').first()
    await hero.hover()
    await expect(hero).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
    await expect(page.locator('.handle')).toHaveCount(8)
    for (const handle of await page.locator('.handle').all()) await expect(handle).toBeHidden()
    await expect(page.locator('.tagl').first()).toBeHidden()
    await expect(page.locator('.canvas')).toHaveCSS('background-image', 'none')
    await expect(page.locator('.page')).toHaveCSS('box-shadow', 'none')

    // A plain document: no listbox, no options, no focusable frames.
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await expect(page.getByRole('option')).toHaveCount(0)
    await expect(page.locator('.blk[tabindex]')).toHaveCount(0)
    await hero.click()
    await expect(page.locator('.blk.sel')).toHaveCount(0)
  })
})

test.describe('mobile', () => {
  test.beforeEach(({ page }) => {
    test.skip(!isNarrow(page), 'narrow screens only')
  })

  test('mobile opens in preview with no visible chrome on first paint', async ({ page }) => {
    // Block the app bundle so we see exactly what the first paint shows.
    await page.route(/\.js$/, (route) => route.abort())
    const response = await page.goto('/')
    const body = await response!.text()
    expect(body).toMatch(/<html lang="en">/)
    expect(body).toContain('(max-width: 1023.98px)')
    await expect(html(page)).toHaveAttribute('data-mode', 'preview')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.layers')).toBeHidden()
    await expect(page.locator('.insp')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeHidden()

    await page.unroute(/\.js$/)
    await page.goto('/')
    await mounted(page)
    await expect(html(page)).toHaveAttribute('data-mode', 'preview')
    await expect(page.locator('.layers')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open in editor' })).toBeVisible()
  })

  test('mobile: Open in editor → tap block → sheet → Move down', async ({ page }) => {
    await page.goto('/')
    await mounted(page)
    await page.getByRole('button', { name: 'Open in editor' }).click()
    await expect(html(page)).toHaveAttribute('data-mode', 'editor')
    await expect(page.getByRole('button', { name: 'Open in editor' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect(page.locator('.layers')).toBeHidden()
    // One column: the canvas fills the screen and nothing overflows sideways.
    const fit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      canvas: document.querySelector('.canvas')!.getBoundingClientRect().width - innerWidth,
    }))
    expect(fit).toEqual({ overflow: 0, canvas: 0 })
    await expect(page.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeInViewport()

    const sheet = page.getByRole('complementary', { name: 'Inspector' })
    await expect(sheet).toHaveCount(0)
    await page.locator('#block-now').click()
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { name: 'Now block' })).toBeVisible()

    const before = await blockOrder(page)
    await sheet.getByRole('button', { name: 'Move down' }).click()
    const after = await blockOrder(page)
    const i = before.indexOf('block-now')
    expect(after[i]).toBe(before[i + 1])
    expect(after[i + 1]).toBe('block-now')

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(html(page)).toHaveAttribute('data-mode', 'preview')
    await expect(sheet).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open in editor' })).toBeVisible()
  })
})

test('no hydration mismatch warnings', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (msg) => messages.push(msg.text()))
  page.on('pageerror', (err) => messages.push(err.message))
  for (const path of ['/', '/?preview']) {
    await page.goto(path)
    await mounted(page)
  }
  expect(messages.filter((m) => /Hydration|mismatch/i.test(m))).toEqual([])
})

test('theme toggle persists across reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await mounted(page)
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  await mounted(page)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})

test('system dark preference is used when nothing is stored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  await mounted(page)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
})

test.describe('no-JS', () => {
  test.use({ javaScriptEnabled: false })

  test('no-JS: content visible on mobile', async ({ page }) => {
    test.skip(!isNarrow(page), 'narrow screens only')
    await page.goto('/')
    await expect(html(page)).not.toHaveAttribute('data-mode', /.*/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.layers')).toBeHidden()
    await expect(page.locator('.insp')).toBeHidden()
  })

  test('no-JS: desktop shows the editor layout', async ({ page }) => {
    test.skip(isNarrow(page), 'desktop only')
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.layers')).toBeVisible()
  })
})
