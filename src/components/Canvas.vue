<script setup lang="ts">
import { computed, ref } from 'vue'
import { content, type BlockId, type BlockMeta } from '../content'
import { blockComponents } from '../blocks/registry'
import { useEditor } from '../editor/store'
import { useDragReorder } from '../editor/dnd'
import BlockFrame from './BlockFrame.vue'

const editor = useEditor()
const page = ref<HTMLElement | null>(null)

const metaById = new Map<BlockId, BlockMeta>(content.blocks.map((b) => [b.id, b]))
const frames = computed(() => editor.order.value.map((id) => metaById.get(id)!))

function blockEls(): Element[] {
  return Array.from(page.value?.querySelectorAll(':scope > .blk') ?? [])
}

const dnd = useDragReorder({
  getRects: () => blockEls().map((el) => el.getBoundingClientRect()),
  indexOf: (id) => editor.order.value.indexOf(id),
  onDrop: (id, to) => editor.move(id, to),
})

/** Top offset of the drop line inside the page card. */
const indicatorTop = computed(() => {
  const at = dnd.indicatorIndex.value
  if (at === null || !page.value) return null
  const els = blockEls()
  if (els.length === 0) return null
  const base = page.value.getBoundingClientRect().top
  const rect = at < els.length ? els[at]!.getBoundingClientRect() : els[els.length - 1]!.getBoundingClientRect()
  const y = at < els.length ? rect.top - 3 : rect.bottom + 3
  return y - base - 1
})

function onCanvasClick(ev: MouseEvent) {
  if ((ev.target as Element | null)?.closest('.blk')) return
  editor.select(null)
}
</script>

<template>
  <div class="canvas" @click="onCanvasClick">
    <div
      ref="page"
      class="page"
      role="listbox"
      aria-label="Page blocks"
      aria-orientation="vertical"
      @dragover="dnd.onDragOver"
      @drop="dnd.onDrop"
      @dragend="dnd.onDragEnd"
    >
      <BlockFrame
        v-for="(meta, i) in frames"
        :key="meta.id"
        :meta="meta"
        :index="i"
        @dragstart-block="dnd.onDragStart"
      >
        <component :is="blockComponents[meta.id]" />
      </BlockFrame>
      <span
        v-if="indicatorTop !== null"
        class="drop"
        aria-hidden="true"
        :style="{ top: indicatorTop + 'px' }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  overflow: auto;
  min-width: 0;
  background-color: var(--canvas);
  background-image: radial-gradient(var(--border) 1px, transparent 1px);
  background-size: 18px 18px;
  padding: 36px 36px 36px 64px;
}
.page {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  background: var(--page);
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 12px 32px rgba(0, 0, 0, 0.06);
  padding: 28px;
}
.drop {
  position: absolute;
  left: 28px;
  right: 28px;
  height: 2px;
  background: var(--accent);
  pointer-events: none;
  z-index: 2;
}
</style>
