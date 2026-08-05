<script setup lang="ts"></script>

<template>
  <footer style="padding: 22px clamp(18px, 4vw, 40px); border-top: 1px solid var(--bord)">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap">
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
      <nav style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap">
        <router-link to="/mentions-legales" class="app-footer-link" style="font-size: 13px; color: var(--tx3)"
          >Mentions légales</router-link
        >
        <a
          href="https://github.com/Mvth1s/Ce-Soir-Je-Joue-A"
          target="_blank"
          rel="noopener"
          class="app-footer-link"
          style="font-size: 13px; color: var(--tx3)"
          >Code source</a
        >
      </nav>
    </div>
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--bord);
      "
    >
      <span style="font-size: 12.5px; color: var(--tx3)">Un jeu à la fois, pas trente.</span>
      <span style="font-size: 12.5px; color: var(--tx3)">
        Vue 3 · TypeScript · Postgres · Vercel — un projet de
        <a href="https://github.com/Mvth1s" target="_blank" rel="noopener" class="app-footer-link" style="color: var(--tx3)"
          >Mvth1s</a
        >
      </span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer-brand:hover span {
  color: var(--acc);
}
.app-footer-link:hover {
  color: var(--acc);
}
</style>
