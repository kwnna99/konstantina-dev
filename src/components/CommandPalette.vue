<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { filterCommands, type Command } from '../editor/commands'

const props = defineProps<{ commands: Command[] }>()
const emit = defineEmits<{ close: [] }>()

const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const list = ref<HTMLElement | null>(null)

const results = computed(() => filterCommands(props.commands, query.value))
const activeId = computed(() => (results.value.length ? 'palette-opt-' + active.value : undefined))

watch(query, () => {
  active.value = 0
})
watch(active, async () => {
  await nextTick()
  list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
})

let previous: HTMLElement | null = null
onMounted(() => {
  previous = document.activeElement as HTMLElement | null
  input.value?.focus()
})
onBeforeUnmount(() => {
  // preventScroll: a "Jump to" command has just scrolled; don't undo it.
  if (previous && previous.isConnected) previous.focus({ preventScroll: true })
})

function runAt(i: number) {
  const cmd = results.value[i]
  if (!cmd) return
  emit('close')
  void cmd.run()
}

function onKeydown(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (n) active.value = (active.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
  } else if (e.key === 'Enter') {
    e.preventDefault()
    runAt(active.value)
  } else if (e.key === 'Tab') {
    // Focus stays inside the dialog: the input is its only tab stop.
    e.preventDefault()
    input.value?.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="backdrop" @mousedown.self="emit('close')">
      <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette" @keydown="onKeydown">
        <input
          ref="input"
          v-model="query"
          class="search"
          type="text"
          role="combobox"
          aria-label="Search commands"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="palette-list"
          :aria-activedescendant="activeId"
          placeholder="Type a command…"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <ul id="palette-list" ref="list" class="list" role="listbox" aria-label="Commands">
          <li
            v-for="(cmd, i) in results"
            :id="'palette-opt-' + i"
            :key="cmd.id"
            role="option"
            :aria-selected="i === active"
            :class="{ on: i === active }"
            @mousemove="active = i"
            @mousedown.prevent
            @click="runAt(i)"
          >
            <span>{{ cmd.label }}</span>
            <small>{{ cmd.group }}</small>
          </li>
          <li v-if="!results.length" class="empty" role="presentation">No matching commands</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: calc(12vh + env(safe-area-inset-top, 0px)) 16px 16px;
  background: rgba(9, 9, 11, 0.45);
}
.palette {
  width: min(560px, 100%);
  max-height: 70dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  font: 14px 'Inter Variable', Inter, system-ui, sans-serif;
}
.search {
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: inherit;
  padding: 14px 16px;
  font: inherit;
  font-size: 15px;
  outline: none;
}
.search:focus-visible {
  box-shadow: inset 0 -2px 0 var(--focus);
}
.list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
}
.list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 7px;
  cursor: pointer;
}
.list li.on {
  background: var(--accent-soft);
  outline: 1px solid var(--focus);
}
small {
  color: var(--muted);
  font-size: 11.5px;
  white-space: nowrap;
}
.empty {
  color: var(--muted);
  cursor: default;
}
</style>
