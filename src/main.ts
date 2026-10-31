import { ViteSSG } from 'vite-ssg/single-page'
import { inject } from '@vercel/analytics'
import './styles/fonts.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'
import { content } from './content'

// Hydrate the pre-rendered HTML instead of re-rendering it from scratch.
export const createApp = ViteSSG(App, undefined, { hydration: true })

if (!import.meta.env.SSR) {
  // Cookieless page views for Vercel Web Analytics; no consent banner needed.
  inject()
  console.log(
    `Hi, curious one. This site is built as a block editor with Vue + TypeScript. Poke around, the source is here: ${content.links.source}`,
  )
}
