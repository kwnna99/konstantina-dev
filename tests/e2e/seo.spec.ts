import { expect, test } from '@playwright/test'

// Mirrors content.identity.intro in src/content/index.ts.
const intro =
  "Technical Lead of Authoring Tools at LearnWorlds. My team builds the editors and content-creation tools course creators use to reach tens of millions of learners. I'm a full-stack engineer with a frontend focus."

// JavaScript is off, so these check the pre-rendered HTML that crawlers and link previews see.
test.use({ javaScriptEnabled: false })

test('title, description, canonical and Open Graph tags are pre-rendered', async ({ page }) => {
  await page.goto('/')
  const title = 'Konstantina Roumelioti, Technical Lead, Authoring Tools'
  await expect(page).toHaveTitle(title)
  expect(await page.locator('title').count()).toBe(1)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', intro)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://konstantina.dev/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://konstantina.dev/og.png')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png')
})

test('JSON-LD describes the person', async ({ page }) => {
  await page.goto('/')
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
  const data = JSON.parse(raw ?? '')
  expect(raw).not.toContain('<')
  expect(data['@type']).toBe('Person')
  expect(data.worksFor.name).toBe('LearnWorlds')
  expect(data.sameAs).toEqual(['https://github.com/kwnna99', 'https://www.linkedin.com/in/konstantina-roumelioti/'])
})

test('icons, social card and crawler files are served', async ({ request }) => {
  expect((await request.get('/favicon.svg')).status()).toBe(200)
  const og = await request.get('/og.png')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toBe('image/png')
  expect((await request.get('/apple-touch-icon.png')).status()).toBe(200)
  const robots = await request.get('/robots.txt')
  expect(await robots.text()).toContain('Sitemap: https://konstantina.dev/sitemap.xml')
  expect((await request.get('/sitemap.xml')).status()).toBe(200)
})

test('404.html is a standalone page with a way home', async ({ page }) => {
  const res = await page.goto('/404.html')
  expect(res?.status()).toBe(200)
  await expect(page).toHaveTitle('Not found · Konstantina Roumelioti')
  await expect(page.getByText("This block doesn't exist (yet).")).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to konstantina.dev' })).toHaveAttribute('href', '/')
})
