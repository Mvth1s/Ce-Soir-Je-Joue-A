<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import BootScreen from "@/components/BootScreen.vue";
import CookieConsentBanner from "@/components/CookieConsentBanner.vue";
import { useCookieConsent } from "@/composables/useCookieConsent";

const { choice } = useCookieConsent();
</script>

<template>
  <div
    class="app-root"
    :class="{ 'app-root--cookie-banner-visible': choice === null }"
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--tx);
    "
  >
    <BootScreen />
    <AppHeader />
    <main style="flex: 1; display: flex; flex-direction: column">
      <router-view />
    </main>
    <AppFooter />
    <CookieConsentBanner />
  </div>
</template>

<style scoped>
/* Reserve statiquement (donc sans decalage de mise en page apres coup, voir
   CLS) l'espace occupe par le bandeau cookies (position: fixed) pour que le
   pied de page ne se retrouve jamais masque derriere lui. Formule ajustee
   empiriquement sur la hauteur reelle du bandeau (son texte fait jusqu'a 3
   lignes sur mobile etroit) avec une marge de securite, pas de mesure JS
   pour eviter un deuxieme rendu apres le premier affichage. */
.app-root--cookie-banner-visible {
  padding-bottom: clamp(150px, 400px - 32vw, 300px);
}
</style>
