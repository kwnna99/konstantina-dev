<script setup lang="ts">
import { computed, ref } from 'vue'
import { content, type BlockId, type BlockMeta } from '../content'
import { useEditor } from '../editor/store'
import { useDragReorder } from '../editor/dnd'

const editor = useEditor()
const list = ref<HTMLElement | null>(null)

const metaById = new Map<BlockId, BlockMeta>(content.blocks.map((b) => [b.id, b]))
const rows = computed(() => editor.order.value.map((id) => metaById.get(id)!))

const dnd = useDragReorder({
  getRects: () => Array.from(list.value?.querySelectorAll('.layer') ?? []).map((el) => el.getBoundingClientRect()),
  indexOf: (id) => editor.order.value.indexOf(id),
  onDrop: (id, to) => editor.move(id, to),
})

function choose(id: BlockId) {
  editor.select(id)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('block-' + id)?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'center',
  })
}

function onKeydown(ev: KeyboardEvent, id: BlockId) {
  if (ev.target !== ev.currentTarget) return
  if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault()
    choose(id)
  }
}
</script>

<template>
  <div class="layers chrome">
    <div class="ph" aria-hidden="true">Layers</div>
    <div
      ref="list"
      class="list"
      role="listbox"
      aria-label="Layers"
      @dragover="dnd.onDragOver"
      @drop="dnd.onDrop"
    >
      <div
        v-for="(meta, i) in rows"
        :key="meta.id"
        class="layer"
        :class="{ on: editor.selected.value === meta.id }"
        role="option"
        tabindex="0"
        draggable="true"
        :aria-selected="editor.selected.value === meta.id"
        @click="choose(meta.id)"
        @keydown="onKeydown($event, meta.id)"
        @dragstart="dnd.onDragStart(meta.id, $event)"
        @dragend="dnd.onDragEnd"
      >
        <em aria-hidden="true">{{ meta.layerIcon }}</em>
        {{ meta.label }}
        <span v-if="dnd.indicatorIndex.value === i" class="drop top" aria-hidden="true"></span>
        <span
          v-if="dnd.indicatorIndex.value === rows.length && i === rows.length - 1"
          class="drop bottom"
          aria-hidden="true"
        ></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layers {
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 14px 10px;
  font-size: 13px;
  overflow: auto;
}
.ph {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--faint);
  text-transform: uppercase;
  padding: 0 8px 8px;
}
.layer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text);
}
.layer:hover {
  background: var(--canvas);
}
.layer.on {
  background: var(--accent-soft);
  font-weight: 500;
}
.layer em {
  font-style: normal;
  width: 18px;
  text-align: center;
  color: var(--faint);
}
.drop {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  pointer-events: none;
}
.drop.top {
  top: -1px;
}
.drop.bottom {
  bottom: -1px;
}
</style>
