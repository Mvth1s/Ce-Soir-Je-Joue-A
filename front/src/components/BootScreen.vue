<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const booting = ref(true);
let bootTimer: ReturnType<typeof setTimeout>;

onMounted(() => {
  bootTimer = setTimeout(() => (booting.value = false), 1900);
});
onUnmounted(() => clearTimeout(bootTimer));
</script>

<template>
  <div
    v-if="booting"
    style="
      position: fixed;
      inset: 0;
      z-index: 200;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 24px;
      animation: fadeout 0.4s 1.5s forwards;
    "
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <span style="font: 400 18px Silkscreen, monospace; color: var(--acc)">▮▮</span>
      <span
        style="
          font-family: 'Pixelify Sans', monospace;
          font-size: clamp(24px, 6vw, 34px);
          font-weight: 600;
          color: var(--tx);
        "
        >ce soir je joue à…</span
      >
    </div>
    <div
      style="
        width: min(300px, 80vw);
        height: 12px;
        border: 2px solid var(--bord);
        border-radius: 3px;
        overflow: hidden;
        background: var(--surf);
      "
    >
      <div style="height: 100%; background: var(--acc); animation: bootbar 1.5s steps(14) forwards"></div>
    </div>
    <span
      style="
        font: 400 9px Silkscreen, monospace;
        color: var(--tx3);
        animation: blink 1s steps(1) infinite;
      "
      >lecture de votre bibliothèque…</span
    >
  </div>
</template>
