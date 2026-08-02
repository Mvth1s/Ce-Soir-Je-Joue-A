<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "@/composables/useTheme";

const route = useRoute();
const { theme, toggleTheme } = useTheme();

const stepLabel = computed(() => {
  switch (route.name) {
    case "criteria":
      return "étape 02 / 03";
    case "results":
      return "étape 03 / 03";
    case "home":
      return "étape 01 / 03";
    default:
      return "";
  }
});

const dot2Active = computed(() => route.name !== "home");
const dot3Active = computed(() => route.name === "results");
const themeLabel = computed(() => (theme.value === "dark" ? "☾ sombre" : "☀ clair"));
</script>

<template>
  <header
    style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px clamp(18px, 4vw, 40px);
      border-bottom: 1px solid var(--bord);
    "
  >
    <router-link
      to="/"
      style="
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
      "
    >
      <span style="font: 400 14px Silkscreen, monospace; color: var(--acc)">▮▮</span>
      <span
        style="
          font-family: 'Pixelify Sans', monospace;
          font-size: 17px;
          font-weight: 600;
          color: var(--tx);
        "
        >ce soir je joue à…</span
      >
    </router-link>
    <div style="display: flex; align-items: center; gap: 12px">
      <span v-if="stepLabel" style="font: 400 9px Silkscreen, monospace; color: var(--tx3)">{{
        stepLabel
      }}</span>
      <div style="display: flex; gap: 4px">
        <span style="width: 20px; height: 5px; border-radius: 2px; background: var(--acc)"></span>
        <span
          style="width: 20px; height: 5px; border-radius: 2px"
          :style="{ background: dot2Active ? 'var(--acc)' : 'var(--bord)' }"
        ></span>
        <span
          style="width: 20px; height: 5px; border-radius: 2px"
          :style="{ background: dot3Active ? 'var(--acc)' : 'var(--bord)' }"
        ></span>
      </div>
      <button
        type="button"
        style="
          font: 700 10px Silkscreen, monospace;
          padding: 8px 12px;
          border-radius: 7px;
          border: 1px solid var(--bord);
          background: var(--surf);
          color: var(--tx2);
          cursor: pointer;
        "
        @click="toggleTheme"
      >
        {{ themeLabel }}
      </button>
      <a
        href="/api/auth/logout"
        style="font: 700 10px Silkscreen, monospace; color: var(--tx3)"
        >déconnexion</a
      >
    </div>
  </header>
</template>
