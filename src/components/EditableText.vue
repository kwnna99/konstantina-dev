<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useEditor } from '../editor/store'

const props = withDefaults(
  defineProps<{
    textKey: string
    original: string
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  }>(),
  { as: 'p' },
)

const editor = useEditor()
const el = ref<HTMLElement | null>(null)
const editing = ref(false)
const editableValue = ref<'plaintext-only' | 'true'>('plaintext-only')

const text = computed(() => editor.textFor(props.textKey, props.original))

function supportsPlaintextOnly(): boolean {
  const probe = document.createElement('div')
  try {
    probe.contentEditable = 'plaintext-only'
  } catch {
    return false
  }
  return probe.contentEditable === 'plaintext-only'
}

async function start() {
  if (editing.value) return
  if (document.documentElement.dataset.mode === 'preview') return
  editableValue.value = supportsPlaintextOnly() ? 'plaintext-only' : 'true'
  editing.value = true
  editor.editingKey.value = props.textKey
  await nextTick()
  const node = el.value
  if (!node) return
  node.focus()
  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function finish() {
  editing.value = false
  if (editor.editingKey.value === props.textKey) editor.editingKey.value = null
}

function commit() {
  if (!editing.value) return
  const value = (el.value?.textContent ?? '').replace(/\s*[\r\n]+\s*/g, ' ')
  editor.setText(props.textKey, value, props.original)
  finish()
}

function cancel() {
  if (!editing.value) return
  finish()
}

function onKeydown(ev: KeyboardEvent) {
  if (!editing.value) return
  if (ev.key === 'Enter') {
    ev.preventDefault()
    commit()
  } else if (ev.key === 'Escape') {
    ev.preventDefault()
    cancel()
  }
}

function onPaste(ev: ClipboardEvent) {
  if (!editing.value) return
  ev.preventDefault()
  const plain = (ev.clipboardData?.getData('text/plain') ?? '').replace(/\s*[\r\n]+\s*/g, ' ')
  if (!plain) return
  const node = el.value
  if (!node) return
  if (typeof document.execCommand === 'function' && document.execCommand('insertText', false, plain)) {
    return
  }
  const selection = window.getSelection()
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  if (range && node.contains(range.commonAncestorContainer)) {
    range.deleteContents()
    const inserted = document.createTextNode(plain)
    range.insertNode(inserted)
    range.setStartAfter(inserted)
    range.collapse(true)
    selection!.removeAllRanges()
    selection!.addRange(range)
  } else {
    node.append(document.createTextNode(plain))
  }
}

// Another field started editing, or the editor was reset: leave without committing.
watch(
  () => editor.editingKey.value,
  (key) => {
    if (editing.value && key !== props.textKey) editing.value = false
  },
)
</script>

<template>
  <!-- Re-keyed on mode change so Vue never patches text nodes the browser has rewritten. -->
  <component
    :is="as"
    :key="editing ? 'edit' : 'view'"
    ref="el"
    class="editable"
    :class="{ editing }"
    :contenteditable="editing ? editableValue : undefined"
    :spellcheck="editing ? true : undefined"
    @dblclick="start"
    @keydown="onKeydown"
    @blur="commit"
    @paste="onPaste"
    >{{ text }}</component
  >
</template>

<style scoped>
.editable.editing {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
  border-radius: 4px;
  cursor: text;
}
</style>
