<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'
</script>

<template>
  <section>
    <EditableText text-key="stack.title" original="Stack" as="h2" id="heading-stack" class="title" />
    <p class="focus">{{ content.identity.focusLine }}</p>
    <ul class="tags">
      <li v-for="tag in content.stack.tags" :key="tag.name" class="tag">
        <i :style="{ background: tag.color }" aria-hidden="true"></i>{{ tag.name }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.focus {
  margin: 0 0 12px;
  font-size: 0.875rem;
  color: var(--muted);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tag {
  display: flex;
  gap: 7px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
}
.tag i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 3px;
}
</style>
