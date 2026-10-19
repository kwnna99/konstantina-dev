<script setup lang="ts">
import { computed } from 'vue'
import type { BlockId, BlockMeta } from '../content'
import { useEditor } from '../editor/store'
import { useMode } from '../editor/mode'

const props = defineProps<{ meta: BlockMeta; index: number }>()
const emit = defineEmits<{ 'dragstart-block': [id: BlockId, ev: DragEvent] }>()

const editor = useEditor()
const { mode } = useMode()
// In preview the frame is plain layout: not focusable, not selectable.
const interactive = computed(() => mode.value === 'editor')
const isSelected = computed(() => editor.selected.value === props.meta.id)

function onClick(ev: MouseEvent) {
  if (!interactive.value) return
  // Clicks inside a text that is being edited belong to the text.
  if ((ev.target as Element | null)?.closest('[contenteditable]')) return
  editor.select(props.meta.id)
}

function onKeydown(ev: KeyboardEvent) {
  // Only react when the frame itself has focus, never to keys typed in children.
  if (!interactive.value || ev.target !== ev.currentTarget) return
  if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault()
    editor.select(props.meta.id)
  }
}
</script>

<template>
  <div
    class="blk"
    :class="{ sel: interactive && isSelected }"
    :tabindex="interactive ? 0 : undefined"
    :role="interactive ? 'group' : undefined"
    :aria-current="interactive && isSelected ? 'true' : undefined"
    :aria-label="interactive ? `${meta.label} block` : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span class="tagl" aria-hidden="true">{{ meta.label }} block</span>
    <button
      type="button"
      class="handle"
      draggable="true"
      :aria-label="`Drag ${meta.label} block`"
      @dragstart="emit('dragstart-block', meta.id, $event)"
    >
      ⋮⋮
    </button>
    <section :id="'block-' + meta.id" :aria-labelledby="'heading-' + meta.id">
      <slot />
    </section>
  </div>
</template>

<style scoped>
.blk {
  position: relative;
  border: 1.5px solid transparent;
  border-radius: 8px;
  padding: 18px 20px;
  margin-bottom: 6px;
  transition: border-color 0.12s;
}
.tagl {
  display: none;
  position: absolute;
  top: -11px;
  left: 12px;
  background: var(--primary);
  color: var(--on-primary);
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.12s;
  pointer-events: none;
}
.handle {
  display: none;
  position: absolute;
  left: -26px;
  top: 18px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--faint);
  font-size: 14px;
  line-height: 1;
  cursor: grab;
  opacity: 0;
}

:global([data-mode='editor'] .blk) {
  cursor: pointer;
}
:global([data-mode='editor'] .tagl),
:global([data-mode='editor'] .handle) {
  display: block;
}
:global([data-mode='editor'] .blk:hover) {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}
:global([data-mode='editor'] .blk:hover .tagl) {
  opacity: 1;
}
:global([data-mode='editor'] .blk:hover .handle),
:global([data-mode='editor'] .blk:focus-within .handle),
:global([data-mode='editor'] .blk.sel .handle) {
  opacity: 1;
}
:global([data-mode='editor'] .blk.sel) {
  border-color: var(--accent);
}
:global([data-mode='editor'] .blk.sel .tagl) {
  opacity: 1;
}
:global([data-mode='editor'] .blk:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
:global([data-mode='editor'] .blk:focus-visible .tagl) {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .blk,
  .tagl {
    transition: none;
  }
}
</style>
