import type { Page } from '@playwright/test'

/**
 * Waits until Vue has hydrated the pre-rendered page. Before that the HTML is
 * on screen but clicks do nothing, so tests that interact must wait for this.
 */
export async function waitForApp(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null
    return Boolean(root?.__vue_app__)
  })
  // Let the post-mount sync (mode, theme) render.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))))
}
