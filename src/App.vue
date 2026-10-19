<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { createEditor, EditorKey } from './editor/store'
import { resolveShortcut } from './editor/shortcuts'
import { useMode } from './editor/mode'
import { useTheme } from './editor/theme'
import TopBar from './components/TopBar.vue'
import LayersPanel from './components/LayersPanel.vue'
import Canvas from './components/Canvas.vue'
import Inspector from './components/Inspector.vue'
import CommandPalette from './components/CommandPalette.vue'
import { buildCommands } from './editor/commands'
import { content } from './content'

const SITE = 'https://konstantina.dev/'
const title = `${content.identity.name}, ${content.identity.role}`
const description = content.identity.intro

useHead({
  title,
  htmlAttrs: { lang: 'en' },
  meta: [
    { name: 'description', content: description },
    { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#0f0f12', media: '(prefers-color-scheme: dark)' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: SITE },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: SITE + 'og.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [
    { rel: 'canonical', href: SITE },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: content.identity.name,
        jobTitle: content.identity.role,
        worksFor: { '@type': 'Organization', name: content.identity.company },
        address: { '@type': 'PostalAddress', addressLocality: 'Athens', addressCountry: 'GR' },
        url: SITE,
        sameAs: [content.links.github, content.links.linkedin],
      }).replace(/</g, '\\u003c'),
    },
  ],
})

const editor = createEditor()
provide(EditorKey, editor)

const modeApi = useMode()
const themeApi = useTheme()
const { mode, isNarrow, setMode, toggle: toggleMode } = modeApi
const { theme, toggle: toggleTheme } = themeApi

// Preview is for reading: nothing stays selected and no text stays in edit mode.
// Clearing editingKey makes an open inline edit leave without committing.
watch(mode, (m) => {
  if (m !== 'preview') return
  editor.select(null)
  editor.editingKey.value = null
})

/** The floating button disappears once clicked, so hand focus to the top bar's Done. */
async function openEditor() {
  setMode('editor')
  await nextTick()
  document.querySelector<HTMLElement>('.mode-btn')?.focus()
}

const paletteOpen = ref(false)

// A short message shown in the top bar's status live region.
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | null = null
async function notify(msg: string) {
  // Clear first so an identical repeated notice is announced again.
  notice.value = ''
  await nextTick()
  notice.value = msg
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = ''
    noticeTimer = null
  }, 3000)
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Built when the palette opens so "Jump to" follows the current block order.
const commands = computed(() =>
  paletteOpen.value
    ? buildCommands({
        editor,
        mode: modeApi,
        theme: themeApi,
        open: (url) => window.open(url, '_blank', 'noopener'),
        copy,
        notify,
      })
    : [],
)

function detectMac(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /Mac|iPhone|iPad/.test(nav.userAgentData?.platform ?? nav.platform ?? '')
}

function isTyping(): boolean {
  if (editor.editingKey.value !== null) return true
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

let isMac = false

function onKeydown(e: KeyboardEvent) {
  const editingText = isTyping()
  const action = resolveShortcut(e, {
    isMac,
    editingText,
    paletteOpen: paletteOpen.value,
    hasSelection: editor.selected.value !== null,
  })
  if (!action) return
  // Preview is a plain document: only the palette and Escape work there.
  if (mode.value === 'preview' && action !== 'palette' && action !== 'escape') return
  e.preventDefault()
  switch (action) {
    case 'undo':
      editor.undo()
      break
    case 'redo':
      editor.redo()
      break
    case 'palette':
      paletteOpen.value = !paletteOpen.value
      break
    case 'escape':
      // While typing, Escape belongs to the text (it cancels the edit).
      if (paletteOpen.value) paletteOpen.value = false
      else if (!editingText) editor.select(null)
      break
    case 'moveUp':
    case 'moveDown': {
      const id = editor.selected.value
      if (id === null) break
      editor.moveBy(id, action === 'moveUp' ? -1 : 1)
      // Reordering moves the DOM node, which drops focus; put it back.
      void Promise.resolve().then(() => {
        const frame = document.getElementById('block-' + id)?.closest<HTMLElement>('.blk')
        frame?.focus({ preventScroll: true })
      })
      break
    }
  }
}

onMounted(() => {
  isMac = detectMac()
  // Capture phase: see the typing state before an inline edit handles the key itself.
  window.addEventListener('keydown', onKeydown, true)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown, true)
  if (noticeTimer) clearTimeout(noticeTimer)
})
</script>

<template>
  <div class="app">
    <TopBar
      :preview="mode === 'preview'"
      :theme="theme"
      :narrow="isNarrow"
      :notice="notice"
      @toggle-preview="toggleMode"
      @toggle-theme="toggleTheme"
      @open-palette="paletteOpen = !paletteOpen"
    />
    <LayersPanel />
    <Canvas />
    <Inspector v-if="!isNarrow" variant="panel" />
    <Inspector v-else-if="mode === 'editor' && editor.selected.value" variant="sheet" />
    <button v-if="isNarrow && mode === 'preview'" type="button" class="open-editor" @click="openEditor">
      Open in editor <span aria-hidden="true">✎</span>
    </button>
    <CommandPalette v-if="paletteOpen" :commands="commands" @close="paletteOpen = false" />
  </div>
</template>

<style scoped>
/* Mode-specific layout (preview, narrow screens, no-JS) lives in styles/base.css. */
.app {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) 250px;
  grid-template-rows: 52px minmax(0, 1fr);
  height: 100dvh;
}
.app > :first-child {
  grid-column: 1 / -1;
}
.open-editor {
  position: fixed;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  background: #4f46e5;
  color: #fff;
  font: 600 14px 'Inter Variable', Inter, system-ui, sans-serif;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
</style>
