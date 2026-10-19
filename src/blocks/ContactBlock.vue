<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'

const { links, contact } = content
</script>

<template>
  <div>
    <EditableText text-key="contact.title" original="Say hi" as="h2" id="heading-contact" class="title" />
    <ul class="links">
      <li><a :href="links.github" target="_blank" rel="noopener">GitHub</a></li>
      <li><a :href="links.linkedin" target="_blank" rel="noopener">LinkedIn</a></li>
      <li><a :href="links.email">Email</a></li>
      <li><a :href="links.source" target="_blank" rel="noopener">View source</a></li>
    </ul>
    <p class="freelance">{{ contact.freelanceLine }}</p>
  </div>
</template>

<style scoped>
.title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.links a {
  display: inline-block;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--text);
}
.links a:hover {
  border-color: var(--accent);
}
.links a:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.freelance {
  margin: 14px 0 0;
  font-size: 0.875rem;
  color: var(--muted);
}
</style>
