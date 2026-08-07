<script setup lang="ts">
import { ref } from "vue";
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import BootScreen from "@/components/BootScreen.vue";
import CookieConsentBanner from "@/components/CookieConsentBanner.vue";

// Reserve l'espace occupe par le bandeau cookies (position: fixed) pour que
// le pied de page ne se retrouve jamais masque derriere lui.
const cookieBannerHeight = ref(0);
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--tx);
    "
    :style="{ paddingBottom: `${cookieBannerHeight}px` }"
  >
    <BootScreen />
    <AppHeader />
    <main style="flex: 1; display: flex; flex-direction: column">
      <router-view />
    </main>
    <AppFooter />
    <CookieConsentBanner @height-change="(h) => (cookieBannerHeight = h)" />
  </div>
</template>
