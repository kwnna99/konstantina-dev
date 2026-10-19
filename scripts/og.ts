/**
 * Generates public/og.png (1200x630 social card) and public/apple-touch-icon.png (180x180).
 *
 * Usage: npm run build && npx tsx scripts/og.ts   (or: npm run og)
 *
 * Needs the built site served at http://localhost:4173. If nothing answers there,
 * this script starts `vite preview` itself and stops it when done.
 * Needs Playwright's chromium (npx playwright install chromium).
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const ORIGIN = 'http://localhost:4173'

async function isUp(): Promise<boolean> {
  try {
    return (await fetch(ORIGIN)).ok
  } catch {
    return false
  }
}

async function ensureServer(): Promise<ChildProcess | null> {
  if (await isUp()) return null
  const child = spawn('npm', ['run', 'preview'], { stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    if (await isUp()) return child
    await new Promise((r) => setTimeout(r, 500))
  }
  child.kill()
  throw new Error('Preview server did not start. Run `npm run build` first.')
}

const server = await ensureServer()
const browser = await chromium.launch()
try {
  // Social card: editor mode, light theme, Hero selected.
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(() => localStorage.setItem('kd-theme', 'light'))
  const page = await ctx.newPage()
  await page.goto(ORIGIN + '/')
  await page.waitForFunction(() => Boolean((document.querySelector('#app') as any)?.__vue_app__))
  await page.locator('#block-hero').click({ position: { x: 4, y: 4 } })
  await page.locator('.blk.sel').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(1190, 620)
  await page.screenshot({ path: 'public/og.png' })
  await ctx.close()

  // Touch icon: the logo full-bleed (iOS fills transparency with black and rounds corners itself).
  const svg = readFileSync('public/logo.svg', 'utf8')
  const icon = await browser.newContext({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 })
  const p = await icon.newPage()
  await p.setContent(
    `<style>html,body{margin:0}div{width:180px;height:180px;background:linear-gradient(135deg,#6366f1,#ec4899)}svg{width:180px;height:180px;display:block}</style><div>${svg}</div>`,
  )
  await p.screenshot({ path: 'public/apple-touch-icon.png' })
  await icon.close()
} finally {
  await browser.close()
  server?.kill()
}
