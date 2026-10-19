import { getCurrentInstance, onMounted, readonly, ref, type Ref } from 'vue'

export type Mode = 'editor' | 'preview'

/** Below the desktop editor breakpoint (1024px) the site opens in preview. */
export const NARROW_QUERY = '(max-width: 1023.98px)'

/**
 * The mode a visit starts in: `?preview` in the URL, or a narrow screen.
 * The inline script in index.html repeats this logic so the first paint is right.
 */
export function initialMode(search: string, isNarrow: boolean): Mode {
  return new URLSearchParams(search).has('preview') || isNarrow ? 'preview' : 'editor'
}

// One shared state for the whole app. It starts as 'editor' / not narrow so the
// server render and the first client render agree; the real values are read
// from the document after mount.
const mode = ref<Mode>('editor')
const isNarrow = ref(false)
let started = false

function readNarrow(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(NARROW_QUERY) : null
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  const media = readNarrow()
  isNarrow.value = media?.matches ?? false
  // Resizing only updates isNarrow. It never changes the mode.
  media?.addEventListener('change', (e) => {
    isNarrow.value = e.matches
  })
  const current = document.documentElement.dataset.mode
  if (current === 'editor' || current === 'preview') {
    mode.value = current
  } else {
    setMode(initialMode(location.search, isNarrow.value))
  }
}

function urlFor(next: Mode): string {
  const params = new URLSearchParams(location.search)
  params.delete('preview')
  let search = params.toString()
  if (next === 'preview') search = search ? search + '&preview' : 'preview'
  return location.pathname + (search ? '?' + search : '') + location.hash
}

function setMode(next: Mode) {
  if (typeof window === 'undefined') return
  start()
  mode.value = next
  document.documentElement.dataset.mode = next
  const url = urlFor(next)
  if (url !== location.pathname + location.search + location.hash) {
    history.replaceState(history.state, '', url)
  }
}

function toggle() {
  setMode(mode.value === 'editor' ? 'preview' : 'editor')
}

export function useMode(): {
  mode: Readonly<Ref<Mode>>
  isNarrow: Readonly<Ref<boolean>>
  setMode(m: Mode): void
  toggle(): void
} {
  if (getCurrentInstance()) onMounted(start)
  else start()
  return { mode: readonly(mode), isNarrow: readonly(isNarrow), setMode, toggle }
}
