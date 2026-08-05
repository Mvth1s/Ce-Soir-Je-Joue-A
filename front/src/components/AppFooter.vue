<script setup lang="ts"></script>

<template>
  <footer
    style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 22px clamp(18px, 4vw, 40px);
      border-top: 1px solid var(--bord);
    "
  >
    <router-link
      to="/"
      class="app-footer-brand"
      style="display: flex; align-items: center; gap: 10px; cursor: pointer"
    >
      <span style="font: 400 13px Silkscreen, monospace; color: var(--tx3)">▮▮</span>
      <span
        style="
          font-family: 'Pixelify Sans', monospace;
          font-size: 14.5px;
          font-weight: 600;
          color: var(--tx3);
        "
        >ce soir je joue à…</span
      >
    </router-link>
    <span style="font-size: 13.5px; color: var(--tx3)">Un jeu à la fois, pas trente.</span>
  </footer>
</template>

<style scoped>
.app-footer-brand:hover span {
  color: var(--acc);
}
</style>
