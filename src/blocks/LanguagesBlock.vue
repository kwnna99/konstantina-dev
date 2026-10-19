<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'
</script>

<template>
  <div>
    <EditableText text-key="languages.title" original="Languages" as="h2" id="heading-languages" class="title" />
    <ul class="rows">
      <li v-for="lang in content.languages" :key="lang.name" class="row">
        <strong>{{ lang.name }}</strong>
        <span>{{ lang.level }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.rows {
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
}
.row:last-child {
  border-bottom: 0;
}
.row span {
  color: var(--muted);
}
</style>
