import { getCurrentInstance, onMounted, readonly, ref, type Ref } from 'vue'
import { safeGet, safeSet } from '../lib/storage'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'kd-theme'

/**
 * A stored choice wins, otherwise the system preference decides.
 * The inline script in index.html repeats this logic so the first paint is right.
 */
export function initialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored
  return prefersDark ? 'dark' : 'light'
}

// Shared state. 'light' until mount, so the server and first client render agree.
const theme = ref<Theme>('light')
let started = false

function apply(next: Theme) {
  theme.value = next
  document.documentElement.dataset.theme = next
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  const current = document.documentElement.dataset.theme
  if (current === 'light' || current === 'dark') {
    theme.value = current
    return
  }
  const prefersDark =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
  apply(initialTheme(safeGet(THEME_KEY), prefersDark))
}

function toggle() {
  if (typeof window === 'undefined') return
  start()
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  apply(next)
  safeSet(THEME_KEY, next)
}

export function useTheme(): { theme: Readonly<Ref<Theme>>; toggle(): void } {
  if (getCurrentInstance()) onMounted(start)
  else start()
  return { theme: readonly(theme), toggle }
}
