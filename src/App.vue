<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { createEditor, EditorKey } from './editor/store'
import { resolveShortcut } from './editor/shortcuts'
import { useMode } from './editor/mode'
import { useTheme } from './editor/theme'
import TopBar from './components/TopBar.vue'
import LayersPanel from './components/LayersPanel.vue'
import Canvas from './components/Canvas.vue'
import Inspector from './components/Inspector.vue'

const editor = createEditor()
provide(EditorKey, editor)

const { mode, isNarrow, setMode, toggle: toggleMode } = useMode()
const { theme, toggle: toggleTheme } = useTheme()

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

// Toggled by the command palette shortcut. The palette itself arrives later.
const paletteOpen = ref(false)

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
  // Preview is a plain document; editor shortcuts are off.
  if (mode.value === 'preview') return
  const editingText = isTyping()
  const action = resolveShortcut(e, {
    isMac,
    editingText,
    paletteOpen: paletteOpen.value,
    hasSelection: editor.selected.value !== null,
  })
  if (!action) return
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
onUnmounted(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div class="app">
    <TopBar
      :preview="mode === 'preview'"
      :theme="theme"
      :narrow="isNarrow"
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
