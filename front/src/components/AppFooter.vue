<script setup lang="ts"></script>

<template>
  <footer
    style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 20px clamp(18px, 4vw, 40px);
      border-top: 1px solid var(--bord);
    "
  >
    <span style="display: flex; align-items: center; gap: 10px">
      <span style="font: 400 12px Silkscreen, monospace; color: var(--tx3)">▮▮</span>
      <span
        style="
          font-family: 'Pixelify Sans', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--tx3);
        "
        >ce soir je joue à…</span
      >
    </span>
    <span style="font-size: 12px; color: var(--tx3)">Un jeu à la fois, pas trente.</span>
  </footer>
</template>
