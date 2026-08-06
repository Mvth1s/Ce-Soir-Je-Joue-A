<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import BootScreen from "@/components/BootScreen.vue";
import CookieConsentBanner from "@/components/CookieConsentBanner.vue";
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
