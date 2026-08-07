<script setup lang="ts">
import { useCookieConsent } from "@/composables/useCookieConsent";

const { choice, accept, refuse } = useCookieConsent();
</script>

<template>
  <div
    v-if="choice === null"
    role="dialog"
    aria-label="Gestion des cookies de mesure d'audience"
    style="
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100;
      display: flex;
      justify-content: center;
      padding: 16px clamp(14px, 4vw, 28px);
    "
  >
    <div
      style="
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        max-width: 760px;
        width: 100%;
        padding: 18px 22px;
        border: 1px solid var(--bord);
        border-radius: 12px;
        background: var(--surf);
        box-shadow: var(--shadow);
      "
    >
      <p style="margin: 0; flex: 1; min-width: 220px; font-size: 13.5px; line-height: 1.6; color: var(--tx2)">
        On utilise Google Analytics pour comprendre l'usage du site (pages visitées, fréquentation), uniquement
        si vous l'acceptez. Rien n'est utilisé à des fins publicitaires. Détails dans les
        <router-link to="/mentions-legales" style="color: var(--acc)">mentions légales</router-link>.
      </p>
      <div style="display: flex; gap: 10px; flex-shrink: 0">
        <button
          type="button"
          class="cookie-btn cookie-btn--ghost"
          style="
            padding: 10px 18px;
            border-radius: 9px;
            border: 1px solid var(--bord);
            background: transparent;
            color: var(--tx2);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
          "
          @click="refuse"
        >
          Refuser
        </button>
        <button
          type="button"
          class="cookie-btn"
          style="
            padding: 10px 18px;
            border-radius: 9px;
            border: 1px solid var(--acc);
            background: var(--acc);
            color: var(--accink);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
          "
          @click="accept"
        >
          Accepter
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cookie-btn:hover {
  transform: translateY(-1px);
}
.cookie-btn--ghost:hover {
  border-color: var(--acc);
  color: var(--acc);
}
</style>
