<script setup lang="ts">
import { FAQ_ITEMS as items } from "@/content/faq";
</script>

<template>
  <section
    style="
      flex: 1;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      padding: clamp(40px, 6vw, 64px) clamp(20px, 5vw, 40px) 64px;
      display: flex;
      flex-direction: column;
      gap: 30px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <div style="display: flex; flex-direction: column; gap: 8px">
      <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
        >questions fréquentes</span
      >
      <h1
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(28px, 5vw, 38px);
          color: var(--tx);
        "
      >
        FAQ
      </h1>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <details v-for="item in items" :key="item.question" class="faq-item">
        <summary class="faq-question">{{ item.question }}</summary>
        <p class="faq-answer">{{ item.answer }}</p>
      </details>
    </div>

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>

<style scoped>
.faq-item {
  border: 1px solid var(--bord);
  border-radius: 11px;
  background: var(--surf);
  padding: 4px 18px;
}
.faq-question {
  cursor: pointer;
  list-style: none;
  padding: 14px 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--tx);
}
.faq-question::-webkit-details-marker {
  display: none;
}
.faq-question::before {
  content: "▸";
  display: inline-block;
  margin-right: 10px;
  color: var(--acc);
  transition: transform 0.15s ease;
}
.faq-item[open] .faq-question::before {
  transform: rotate(90deg);
}
.faq-answer {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--tx2);
}
</style>
