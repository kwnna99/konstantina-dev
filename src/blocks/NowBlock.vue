<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'
</script>

<template>
  <div>
    <EditableText text-key="now.title" original="What I do now" as="h2" id="heading-now" class="title" />
    <ul class="grid">
      <li v-for="card in content.now" :key="card.title" class="card">
        <strong>{{ card.title }}</strong>
        <span v-if="card.body">{{ card.body }}</span>
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
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted);
}
.card strong {
  display: block;
  margin-bottom: 2px;
  color: var(--text);
}
@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
