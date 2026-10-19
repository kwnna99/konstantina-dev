<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEditor } from '../editor/store'
import { isApplePlatform } from '../editor/shortcuts'
import Icon from './Icon.vue'

// The mode button's label and the theme button's icon and name are all rendered;
// CSS on <html data-mode / data-theme> shows the right one. index.html sets those
// attributes before first paint, so the bar is right before (or without) hydration.
const props = withDefaults(defineProps<{ notice?: string; announce?: string }>(), {
  notice: '',
  announce: '',
})
const emit = defineEmits<{
  'toggle-preview': []
  'toggle-theme': []
  'open-palette': []
}>()

const editor = useEditor()

const statusText = computed(() =>
  editor.status.value === 'saved'
    ? '● All changes saved'
    : editor.status.value === 'saving'
      ? 'Saving…'
      : '● All changes saved (just kidding, it resets on reload)',
)
// What the live region says. It starts empty and only changes when something
// happens: a save-status change, or an announcement from the app (which clears
// it first so a repeated message is read again). Clearing never falls back to
// the status text, so nothing is announced twice.
const liveText = ref('')
watch(statusText, (text) => {
  liveText.value = text
})
watch(
  () => props.announce,
  (text) => {
    liveText.value = text
  },
)

// Server and first client render say ⌘K; the real platform is read after mount.
const hintKeys = ref('⌘K')
onMounted(() => {
  hintKeys.value = isApplePlatform(navigator) ? '⌘K' : 'Ctrl K'
})
</script>

<template>
  <header class="bar">
    <img src="/logo.svg" width="26" height="26" alt="" />
    <div class="crumb">konstantina.dev / <b>home</b></div>

    <div class="tools chrome">
      <button type="button" class="tool" aria-label="Undo" :disabled="!editor.canUndo.value" @click="editor.undo()">
        <Icon name="undo" />
      </button>
      <button type="button" class="tool" aria-label="Redo" :disabled="!editor.canRedo.value" @click="editor.redo()">
        <Icon name="redo" />
      </button>
      <span class="tool deco" aria-hidden="true"><Icon name="pointer" /></span>
      <span class="tool deco" aria-hidden="true"><Icon name="frame" /></span>
      <span class="tool deco" aria-hidden="true"><Icon name="text" /></span>
    </div>

    <div class="right">
      <button type="button" class="btn chrome hint" @click="emit('open-palette')">
        <span aria-hidden="true">{{ hintKeys }}</span>
        <span class="sr">Open command palette</span>
      </button>
      <!-- One live region, always in the accessibility tree; the visible chips are aria-hidden. -->
      <span class="sr" role="status" aria-live="polite">{{ liveText }}</span>
      <span v-if="notice" class="status notice" aria-hidden="true">{{ notice }}</span>
      <span v-else class="status chrome" aria-hidden="true">{{ statusText }}</span>
      <button type="button" class="btn primary mode-btn" @click="emit('toggle-preview')">
        <span class="lbl-preview">Preview</span>
        <span class="lbl-done">Done</span>
        <span class="lbl-back">Back to editor</span>
      </button>
      <button type="button" class="tool theme" @click="emit('toggle-theme')">
        <span class="when-light"><Icon name="sun" /><span class="sr">Switch to dark theme</span></span>
        <span class="when-dark"><Icon name="moon" /><span class="sr">Switch to light theme</span></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 52px;
  padding: 0 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.crumb {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--muted);
  white-space: nowrap;
}
.crumb b {
  color: var(--text);
  font-weight: 600;
}
.tools {
  display: flex;
  gap: 4px;
  margin-left: 24px;
}
.tool {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: none;
  display: grid;
  place-items: center;
  color: var(--muted);
  padding: 0;
  font: inherit;
}
button.tool {
  cursor: pointer;
}
button.tool:hover:not(:disabled) {
  background: var(--canvas);
}
button.tool:disabled {
  opacity: 0.4;
  cursor: default;
}
.right {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}
.status {
  font-size: 12px;
  color: var(--success);
}
.btn {
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  border-radius: 7px;
  padding: 6px 12px;
  font: 500 12.5px 'Inter Variable', Inter, system-ui, sans-serif;
  cursor: pointer;
}
.btn.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/*
 * Exactly one label and one theme face is displayed; the others are display:none,
 * which also keeps them out of the accessibility tree.
 */
.when-light,
.when-dark {
  display: grid;
  place-items: center;
}
:global(:root[data-mode='editor'] .mode-btn .lbl-back),
:global(:root[data-mode='preview'] .mode-btn .lbl-preview),
:global(:root[data-mode='preview'] .mode-btn .lbl-done),
:global(:root[data-theme='dark'] .theme .when-light),
:global(:root:not([data-theme='dark']) .theme .when-dark) {
  display: none;
}
@media (min-width: 1024px) {
  .lbl-done {
    display: none;
  }
}
/* Narrow screens: keep only what fits and works by touch. */
@media (max-width: 1023.98px) {
  .bar {
    gap: 8px;
    padding: 0 12px;
  }
  .tools {
    margin-left: 4px;
  }
  .deco,
  .hint,
  .lbl-preview,
  .status:not(.notice) {
    display: none;
  }
  .status.notice {
    font-size: 11.5px;
    max-width: 38vw;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none;
  }
}
</style>
