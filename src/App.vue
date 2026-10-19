<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { createEditor, EditorKey } from './editor/store'
import { resolveShortcut } from './editor/shortcuts'
import TopBar from './components/TopBar.vue'
import LayersPanel from './components/LayersPanel.vue'
import Canvas from './components/Canvas.vue'
import Inspector from './components/Inspector.vue'

const editor = createEditor()
provide(EditorKey, editor)

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
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app">
    <TopBar @open-palette="paletteOpen = !paletteOpen" />
    <LayersPanel />
    <Canvas />
    <Inspector variant="panel" />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) 250px;
  grid-template-rows: 52px minmax(0, 1fr);
  height: 100dvh;
}
.app > :first-child {
  grid-column: 1 / -1;
}
</style>
