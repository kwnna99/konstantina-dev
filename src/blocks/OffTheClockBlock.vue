<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'

const { offClock, links } = content
</script>

<template>
  <section>
    <EditableText text-key="offclock.title" original="Off the clock" as="h2" id="heading-offclock" class="title" />
    <EditableText text-key="offclock.leadLine" :original="offClock.leadLine" as="p" class="lead" />
    <p class="reads">
      <a :href="links.bookstagram" target="_blank" rel="noopener">{{ links.bookstagramHandle }}</a>
    </p>
    <ul class="items">
      <li v-for="item in offClock.items" :key="item.title">
        <strong>{{ item.title }}</strong>
        <span v-if="item.body"> · {{ item.body }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.title {
  margin: 0 0 8px;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
.lead {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}
.reads {
  margin: 4px 0 12px;
  font-size: 0.875rem;
}
.reads a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.items {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--muted);
}
.items strong {
  color: var(--text);
  font-weight: 600;
}
</style>
