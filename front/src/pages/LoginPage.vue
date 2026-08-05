<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const authFailed = computed(() => route.query.auth_error === "1");
</script>

<template>
  <section
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: clamp(48px, 9vw, 90px) clamp(20px, 5vw, 40px);
      text-align: center;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
      >dernière étape avant votre podium</span
    >
    <h1
      style="
        margin: 0;
        font-family: 'Pixelify Sans', monospace;
        font-weight: 600;
        font-size: clamp(32px, 6vw, 46px);
        line-height: 1.05;
        max-width: 16ch;
        color: var(--tx);
      "
    >
      Connectez votre compte Steam
    </h1>
    <p
      style="
        margin: 0;
        max-width: 48ch;
        font-size: clamp(15px, 2vw, 16px);
        line-height: 1.65;
        color: var(--tx2);
      "
    >
      On passe par la page officielle de Steam. Le site ne voit jamais votre mot de passe.
    </p>
    <a
      href="/api/auth/steam"
      class="steam-login-btn"
      style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 6px;
        padding: 17px 30px;
        border-radius: 11px;
        border: 1px solid var(--acc);
        background: var(--acc);
        color: var(--accink);
        font-family: 'Space Grotesk', sans-serif;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 0 0 4px color-mix(in oklch, var(--acc) 18%, transparent);
        transition: transform 0.15s ease;
      "
    >
      <span style="font: 400 13px Silkscreen, monospace">▶</span>Se connecter avec Steam
    </a>
    <span style="font-size: 13.5px; color: var(--tx3)"
      >Lecture seule. On ne modifie rien dans votre compte.</span
    >
    <span v-if="authFailed" style="font-size: 13.5px; color: var(--tx3)"
      >La connexion à Steam a échoué, réessayez.</span
    >
    <router-link to="/" style="font-size: 13px; color: var(--tx3); margin-top: 8px">‹ retour</router-link>
  </section>
</template>

<style scoped>
.steam-login-btn:hover {
  transform: translateY(-2px);
}
</style>
