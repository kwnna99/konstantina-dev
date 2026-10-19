import { expect, test } from '@playwright/test'

test.use({ javaScriptEnabled: false })

test('the pre-rendered page has the name heading without JavaScript', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Konstantina Roumelioti')
})
