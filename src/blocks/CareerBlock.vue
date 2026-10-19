<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'

const { education } = content
</script>

<template>
  <section>
    <EditableText text-key="career.title" original="How I got here" as="h2" id="heading-career" class="title" />
    <ol class="tl">
      <li v-for="role in content.career" :key="role.title + role.start" class="item">
        <strong>{{ role.title }}</strong>
        <small>{{ role.start }} – {{ role.end ?? 'now' }} · {{ role.org }}</small>
        <p>{{ role.summary }}</p>
      </li>
      <li class="item">
        <strong>{{ education.degree }}</strong>
        <small>{{ education.school }} · {{ education.start }} – {{ education.end }}</small>
        <p>{{ education.note }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.title {
  margin: 0 0 14px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.tl {
  position: relative;
  margin: 0;
  padding: 0 0 0 22px;
  list-style: none;
}
.tl::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: linear-gradient(var(--accent), var(--accent-2));
}
.item {
  position: relative;
  margin-bottom: 14px;
  font-size: 0.84375rem;
}
.item:last-child {
  margin-bottom: 0;
}
.item::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 4px;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--page);
  border: 2px solid var(--accent);
}
.item strong {
  display: block;
}
.item small {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
}
.item p {
  margin: 4px 0 0;
  line-height: 1.55;
  color: var(--muted);
}
</style>
