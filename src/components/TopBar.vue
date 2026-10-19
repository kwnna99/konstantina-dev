<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEditor } from '../editor/store'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{ preview?: boolean; theme?: 'light' | 'dark'; narrow?: boolean; notice?: string }>(), {
  preview: false,
  notice: '',
  theme: 'light',
  narrow: false,
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
const liveText = computed(() => props.notice || statusText.value)

// Server and first client render say ⌘K; the real platform is read after mount.
const hintKeys = ref('⌘K')
onMounted(() => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const mac = /Mac|iPhone|iPad/.test(nav.userAgentData?.platform ?? nav.platform ?? '')
  hintKeys.value = mac ? '⌘K' : 'Ctrl K'
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
        {{ preview ? 'Back to editor' : narrow ? 'Done' : 'Preview' }}
      </button>
      <button
        type="button"
        class="tool theme"
        :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="emit('toggle-theme')"
      >
        <Icon :name="theme === 'dark' ? 'moon' : 'sun'" />
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
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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
