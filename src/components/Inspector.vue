<script setup lang="ts">
import { computed } from 'vue'
import { content } from '../content'
import { useEditor } from '../editor/store'

withDefaults(defineProps<{ variant?: 'panel' | 'sheet' }>(), { variant: 'panel' })

const editor = useEditor()
const meta = computed(() => content.blocks.find((b) => b.id === editor.selected.value) ?? null)
</script>

<template>
  <aside class="insp chrome" :class="variant" aria-label="Inspector">
    <template v-if="meta">
      <div v-if="variant === 'sheet'" class="sheet-actions">
        <button type="button" @click="editor.moveBy(meta.id, -1)">Move up</button>
        <button type="button" @click="editor.moveBy(meta.id, 1)">Move down</button>
        <button type="button" class="close" aria-label="Close inspector" @click="editor.select(null)">✕</button>
      </div>
      <h2>{{ meta.label }} block</h2>
      <p class="desc">{{ meta.description }}</p>
      <div v-for="[key, value] in meta.properties" :key="key" class="prop">
        <span class="k">{{ key }}</span>
        <span class="v">{{ value }}</span>
      </div>
    </template>
    <p v-else class="empty">Select a block to inspect it</p>
  </aside>
</template>

<style scoped>
.insp {
  background: var(--panel);
  border-left: 1px solid var(--border);
  padding: 14px;
  font-size: 13px;
  overflow: auto;
}
.insp.sheet {
  border-left: 0;
  border-top: 1px solid var(--border);
}
h2 {
  margin: 0 0 2px;
  font-size: 14px;
}
.desc {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--muted);
}
.empty {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}
.prop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  gap: 10px;
}
.k {
  color: var(--muted);
}
.v {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  background: var(--canvas);
  padding: 3px 7px;
  border-radius: 5px;
  text-align: right;
}
.sheet-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.sheet-actions button {
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  border-radius: 7px;
  padding: 8px 12px;
  font: 500 12.5px 'Inter Variable', Inter, system-ui, sans-serif;
  cursor: pointer;
}
.sheet-actions .close {
  margin-left: auto;
}
</style>
