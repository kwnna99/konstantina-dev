import { expect, test, type Page } from '@playwright/test'
import { waitForApp } from './helpers.ts'

const layers = (page: Page) => page.getByRole('listbox', { name: 'Layers' }).getByRole('option')
const inspector = (page: Page) => page.getByRole('complementary', { name: 'Inspector' })

/** The platform's command modifier, matching the app's own detection. */
async function mod(page: Page) {
  const mac = await page.evaluate(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    return /mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || '')
  })
  return mac ? 'Meta' : 'Control'
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForApp(page)
  await expect(layers(page).first()).toHaveText(/Hero/)
})

/** Native drag with a shared DataTransfer, for when pointer-driven dragTo is unreliable. */
async function dragHandle(page: Page, sourceSel: string, targetSel: string, where: 'top' | 'center' | 'bottom') {
  await page.evaluate(
    ([s, t, w]) => {
      const src = document.querySelector(s!)!
      const tgt = document.querySelector(t!)!
      const dt = new DataTransfer()
      const r = tgt.getBoundingClientRect()
      const y = w === 'top' ? r.top + 2 : w === 'bottom' ? r.bottom - 2 : r.top + r.height / 2
      const x = r.left + r.width / 2
      src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
      tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }))
      tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }))
      src.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }))
    },
    [sourceSel, targetSel, where] as const,
  )
}

test('click block selects it and fills inspector', async ({ page }) => {
  await expect(inspector(page)).toContainText('Select a block to inspect it')
  await page.locator('#block-stack').click()
  await expect(inspector(page).getByRole('heading', { name: 'Stack block' })).toBeVisible()
})

test('layers click scrolls & selects', async ({ page }) => {
  await layers(page).filter({ hasText: 'Contact' }).click()
  await expect(page.locator('#block-contact')).toBeInViewport()
  await expect(layers(page).filter({ hasText: 'Contact' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('group', { name: 'Contact block' })).toHaveAttribute('aria-current', 'true')
})

test('drag handle reorders, undo restores, redo reapplies', async ({ page }) => {
  await dragHandle(page, 'button[aria-label="Drag Contact block"]', '#block-hero', 'top')
  await expect(layers(page).first()).toHaveText(/Contact/)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(layers(page).first()).toHaveText(/Hero/)
  await page.keyboard.press(`${await mod(page)}+Shift+Z`)
  await expect(layers(page).first()).toHaveText(/Contact/)
})

test('native pointer drag of a handle onto another block reorders', async ({ page }) => {
  const handle = page.locator('button[aria-label="Drag Now block"]')
  await handle.dragTo(page.locator('#block-hero'), { targetPosition: { x: 50, y: 2 } })
  await expect(layers(page).first()).toHaveText(/Now/)
})

test('drop in same place adds no history', async ({ page }) => {
  await dragHandle(page, 'button[aria-label="Drag Now block"]', '#block-now', 'center')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await dragHandle(page, 'button[aria-label="Drag Now block"]', '#block-hero', 'bottom')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
})

test('Alt+ArrowDown moves the selected block and keeps focus on it; edges are no-ops', async ({ page }) => {
  await page.locator('#block-hero').click()
  await page.keyboard.press('Alt+ArrowUp')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(layers(page).first()).toHaveText(/Now/)
  await expect(layers(page).nth(1)).toHaveText(/Hero/)
  await expect(page.getByRole('group', { name: 'Hero block' })).toBeFocused()
  await page.locator('#block-contact').click()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(layers(page).last()).toHaveText(/Contact/)
})

test('Layers is one Tab stop with arrow-key navigation', async ({ page }) => {
  const tabStops = () => page.locator('.layer[tabindex="0"]')
  await expect(tabStops()).toHaveCount(1)
  await expect(tabStops()).toHaveText(/Hero/)
  await expect(page.locator('.layer[tabindex="-1"]')).toHaveCount(7)

  await layers(page).first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(layers(page).nth(1)).toBeFocused()
  await page.keyboard.press('End')
  await expect(layers(page).last()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(layers(page).last()).toBeFocused()
  await page.keyboard.press('Home')
  await expect(layers(page).first()).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(layers(page).first()).toBeFocused()
  // Moving focus does not select.
  await expect(page.locator('.layer[aria-selected="true"]')).toHaveCount(0)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(layers(page).nth(2)).toHaveAttribute('aria-selected', 'true')
  await expect(inspector(page).getByRole('heading', { name: 'Stack block' })).toBeVisible()
  // The Tab stop follows the selection.
  await expect(tabStops()).toHaveCount(1)
  await expect(tabStops()).toHaveText(/Stack/)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press(' ')
  await expect(layers(page).nth(3)).toHaveAttribute('aria-selected', 'true')
})

test('Alt+Arrow on a focused layer row moves that block and keeps focus on the row', async ({ page }) => {
  await layers(page).first().focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Alt+ArrowDown')
  await expect(layers(page).nth(2)).toHaveText(/Now/)
  await expect(layers(page).nth(2)).toBeFocused()
  await page.keyboard.press('Alt+ArrowUp')
  await page.keyboard.press('Alt+ArrowUp')
  await expect(layers(page).first()).toHaveText(/Now/)
  await expect(layers(page).first()).toBeFocused()
  await expect(layers(page).first()).toHaveAttribute('aria-selected', 'true')
})

test('inline edit then Cmd+Z inside the text does not undo the editor', async ({ page, browserName }) => {
  // Create a history entry first so a leaked undo would be visible.
  await layers(page).first().click()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(layers(page).nth(1)).toHaveText(/Hero/)
  const headline = page.locator('#block-hero .headline')
  await headline.dblclick()
  await page.keyboard.type('Hello')
  await expect(headline).toContainText('Hello')
  await page.evaluate(() => {
    ;(window as any).__prevented = null
    window.addEventListener('keydown', (e) => ((window as any).__prevented = e.defaultPrevented))
  })
  await page.keyboard.press(`${await mod(page)}+Z`)
  // The app leaves the key to the text field.
  expect(await page.evaluate(() => (window as any).__prevented)).toBe(false)
  await expect(layers(page).nth(1)).toHaveText(/Hero/)
  await expect(layers(page).first()).toHaveText(/Now/)
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
  await expect(headline).toBeFocused()
  await expect(headline).toHaveAttribute('contenteditable', /.+/)
  // The text is the field's own business: Chromium (under Playwright) leaves the typing
  // in place, Firefox runs its native text undo, which removes the typing and nothing else.
  if (browserName === 'firefox') await expect(headline).toHaveText('I build tools for builders.')
  else await expect(headline).toContainText('Hello')
})

test('Escape during an inline edit keeps the block selected', async ({ page }) => {
  await page.locator('#block-hero .headline').dblclick()
  await page.keyboard.type('Hello')
  await page.keyboard.press('Escape')
  await expect(inspector(page).getByRole('heading', { name: 'Hero block' })).toBeVisible()
  await expect(page.locator('#block-hero .headline')).not.toContainText('Hello')
})

test('Escape deselects; clicking empty canvas deselects', async ({ page }) => {
  await page.locator('#block-now').click()
  await expect(inspector(page).getByRole('heading', { name: 'Now block' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(inspector(page)).toContainText('Select a block to inspect it')
  await page.locator('#block-now').click()
  await page.mouse.click(1010, 400)
  await expect(inspector(page)).toContainText('Select a block to inspect it')
})
