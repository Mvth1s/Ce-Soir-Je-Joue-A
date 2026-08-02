<script setup lang="ts">
import AppHeader from "@/components/AppHeader.vue";
import BootScreen from "@/components/BootScreen.vue";
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
  </div>
</template>
