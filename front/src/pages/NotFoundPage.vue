<script setup lang="ts"></script>

<template>
  <section
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: clamp(48px, 9vw, 90px) clamp(20px, 5vw, 40px);
      text-align: center;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <span style="font: 400 10px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
      >erreur 404</span
    >
    <h1
      style="
        margin: 0;
        font-family: 'Pixelify Sans', monospace;
        font-weight: 600;
        font-size: clamp(34px, 7vw, 52px);
        line-height: 1.05;
        color: var(--tx);
      "
    >
      Cette page n'existe pas<span style="color: var(--acc); animation: blink 1.1s steps(1) infinite">_</span>
    </h1>
    <p style="margin: 0; max-width: 46ch; font-size: 15px; line-height: 1.65; color: var(--tx2)">
      Le lien est peut-être cassé, ou la page a été déplacée. Retournez à l'accueil pour repartir de zéro.
    </p>
    <router-link
      to="/"
      class="error-page-btn"
      style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 6px;
        padding: 15px 26px;
        border-radius: 11px;
        border: 1px solid var(--acc);
        background: var(--acc);
        color: var(--accink);
        font-family: 'Space Grotesk', sans-serif;
        font-size: 15px;
        font-weight: 600;
      "
    >
      <span style="font: 400 12px Silkscreen, monospace">▶</span>Retour à l'accueil
    </router-link>
  </section>
</template>

<style scoped>
.error-page-btn:hover {
  transform: translateY(-2px);
}
</style>
