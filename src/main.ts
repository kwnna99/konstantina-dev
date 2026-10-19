import { ViteSSG } from 'vite-ssg/single-page'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'

// Hydrate the pre-rendered HTML instead of re-rendering it from scratch.
export const createApp = ViteSSG(App, undefined, { hydration: true })
