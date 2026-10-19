<script setup lang="ts">
export type IconName = 'undo' | 'redo' | 'pointer' | 'frame' | 'text' | 'command' | 'sun' | 'moon'

defineProps<{ name: IconName }>()

const paths: Record<IconName, string> = {
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  pointer: 'm5 3 14 7-6 2-2 6z',
  frame: 'M4 4h16v16H4zM4 9h16',
  text: 'M5 6V4h14v2M12 4v16M9 20h6',
  command: 'M9 9V6a3 3 0 1 0-3 3zm0 0h6m-6 0v6m6-6V6a3 3 0 1 1 3 3zm0 0v6m0 0h3a3 3 0 1 1-3 3zm0 0H9m0 0v3a3 3 0 1 1-3-3z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
}
</script>

<template>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name]" />
  </svg>
</template>
