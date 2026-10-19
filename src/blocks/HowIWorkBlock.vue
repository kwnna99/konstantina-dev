<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'
</script>

<template>
  <section>
    <EditableText text-key="how.title" original="How I work" as="h2" id="heading-how" class="title" />
    <ul class="grid">
      <li
        v-for="card in content.howIWork"
        :key="card.title"
        class="card"
        :class="{ emphasis: card.emphasis }"
      >
        {{ card.title }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text);
}
.card.emphasis {
  border-color: transparent;
  font-weight: 600;
  background:
    linear-gradient(var(--accent-soft), var(--accent-soft)) padding-box,
    linear-gradient(90deg, var(--accent), var(--accent-2)) border-box;
}
</style>
