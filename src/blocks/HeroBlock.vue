<script setup lang="ts">
import { content } from '../content'
import EditableText from '../components/EditableText.vue'

const { identity, links } = content
</script>

<template>
  <div class="hero">
    <h1 id="heading-hero" class="name">{{ identity.name }}</h1>
    <EditableText text-key="hero.headline" :original="identity.headline" as="p" class="headline" />
    <EditableText text-key="hero.intro" :original="identity.intro" as="p" class="intro" />
    <a class="pill" :href="links.jobPosting" target="_blank" rel="noopener">
      <span aria-hidden="true">●</span> My team is hiring →
    </a>
  </div>
</template>

<style scoped>
.name {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--muted);
}
.headline {
  margin: 0;
  font-size: clamp(2rem, 6vw, 2.625rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--accent-text);
}
@supports (background-clip: text) or (-webkit-background-clip: text) {
  .headline {
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
.intro {
  margin: 12px 0 0;
  max-width: 34rem;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--muted);
}
.pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--success);
  background: transparent;
  border: 1px solid var(--success);
}
.pill:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.pill:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
</style>
