<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useCriteria } from "@/composables/useCriteria";
import PodiumCard, { type PodiumSuggestion } from "@/components/PodiumCard.vue";

type Phase = "loading" | "results" | "error";

const router = useRouter();
const { state, summary } = useCriteria();

const phase = ref<Phase>("loading");
const suggestions = ref<PodiumSuggestion[]>([]);

const summaryLower = computed(() => summary.value.toLowerCase());

const isValidResult = computed(
  () =>
    suggestions.value.length === 3 &&
    ([1, 2, 3] as const).every((rank) => suggestions.value.some((s) => s.rank === rank)),
);

const goldSuggestion = computed(() => suggestions.value.find((s) => s.rank === 1) ?? null);
const silverSuggestion = computed(() => suggestions.value.find((s) => s.rank === 2) ?? null);
const bronzeSuggestion = computed(() => suggestions.value.find((s) => s.rank === 3) ?? null);

const isFreeGamesFallback = computed(
  () => suggestions.value.length > 0 && suggestions.value.every((s) => s.match === null),
);

// Precharge les affiches pendant que l'ecran de calcul est encore affiche,
// pour que les cartes du podium apparaissent avec leurs images deja pretes
// plutot que de les voir se charger une a une. Un delai max evite de bloquer
// l'affichage si une affiche est lente ou indisponible.
function preloadImages(urls: string[], timeoutMs = 2500): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
          setTimeout(resolve, timeoutMs);
        }),
    ),
  );
}

async function fetchSuggestions() {
  phase.value = "loading";
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moods: state.moods,
        fatigue: state.fatigue,
        time: state.time,
        moment: state.moment,
      }),
    });
    if (res.status === 401) {
      router.push("/");
      return;
    }
    if (!res.ok) {
      phase.value = "error";
      return;
    }
    const data = (await res.json()) as { suggestions: PodiumSuggestion[] };
    suggestions.value = data.suggestions;
    const posterUrls = data.suggestions
      .map((s) => s.posterUrl)
      .filter((url): url is string => Boolean(url));
    if (posterUrls.length > 0) {
      await preloadImages(posterUrls);
    }
    phase.value = "results";
  } catch {
    phase.value = "error";
  }
}

function retry() {
  fetchSuggestions();
}

function editCriteria() {
  router.push("/criteres");
}

onMounted(fetchSuggestions);
</script>

<template>
  <section
    v-if="phase === 'loading'"
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      padding: 80px 24px;
      animation: pagein 0.35s ease;
    "
  >
    <div style="display: flex; gap: 7px">
      <span
        v-for="i in 5"
        :key="i"
        :style="{
          width: '16px',
          height: '16px',
          background: 'var(--acc)',
          animation: `pulseblock 1s ease-in-out ${(i - 1) * 0.12}s infinite`,
        }"
      ></span>
    </div>
    <span
      style="
        font-family: 'Pixelify Sans', monospace;
        font-size: clamp(20px, 4vw, 26px);
        font-weight: 600;
        color: var(--tx);
        text-align: center;
      "
      >On trie votre bibliothèque…</span
    >
    <div
      style="
        width: min(320px, 80vw);
        height: 10px;
        border: 2px solid var(--bord);
        border-radius: 3px;
        overflow: hidden;
        background: var(--surf);
      "
    >
      <div style="height: 100%; background: var(--acc); animation: bootbar 1.5s steps(12) forwards"></div>
    </div>
    <span style="font: 400 9px Silkscreen, monospace; color: var(--tx3); text-align: center">{{
      summaryLower
    }}</span>
  </section>

  <section
    v-else-if="phase === 'error' || !isValidResult"
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding: 80px 24px;
      text-align: center;
      animation: pagein 0.4s ease;
    "
  >
    <span style="font: 400 10px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
      >une erreur est survenue</span
    >
    <h2
      style="
        margin: 0;
        font-family: 'Pixelify Sans', monospace;
        font-weight: 600;
        font-size: clamp(24px, 5vw, 32px);
        color: var(--tx);
      "
    >
      Impossible de calculer vos suggestions pour le moment.
    </h2>
    <p style="margin: 0; max-width: 46ch; font-size: 14px; line-height: 1.6; color: var(--tx2)">
      Réessayez dans un instant. Si le problème persiste, vérifiez votre connexion Steam.
    </p>
    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center">
      <button
        type="button"
        class="results-btn results-btn--primary"
        style="
          padding: 15px 26px;
          border-radius: 11px;
          border: 1px solid var(--acc);
          background: var(--acc);
          color: var(--accink);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        "
        @click="retry"
      >
        Réessayer
      </button>
      <button
        type="button"
        class="results-btn"
        style="
          padding: 15px 22px;
          border-radius: 11px;
          border: 1px solid var(--bord);
          background: var(--surf);
          color: var(--tx2);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14.5px;
          cursor: pointer;
        "
        @click="editCriteria"
      >
        Modifier mes critères
      </button>
    </div>
  </section>

  <section
    v-else
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: clamp(26px, 4vw, 36px) clamp(16px, 4vw, 40px) 48px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <span style="font: 400 10px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px; text-align: center">{{
      summaryLower
    }}</span>
    <h2
      style="
        margin: 2px 0 0;
        font-family: 'Pixelify Sans', monospace;
        font-weight: 600;
        font-size: clamp(28px, 5vw, 38px);
        color: var(--tx);
        text-align: center;
      "
    >
      Votre podium du soir
    </h2>
    <p style="margin: 0 0 8px; font-size: 13.5px; color: var(--tx2); text-align: center">
      Survolez une carte pour lire l'explication · cliquez pour ouvrir la fiche Steam.
    </p>
    <p
      v-if="isFreeGamesFallback"
      style="
        margin: 0 0 24px;
        max-width: 56ch;
        font-size: 13px;
        line-height: 1.55;
        color: var(--tx2);
        text-align: center;
      "
    >
      Votre bibliothèque Steam est vide : voici une sélection de jeux gratuits sur Steam pour ce soir.
    </p>
    <div v-else style="margin-bottom: 24px"></div>

    <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: center; gap: clamp(14px, 2.5vw, 26px)">
      <PodiumCard v-if="silverSuggestion" :suggestion="silverSuggestion" size="silver" />
      <PodiumCard v-if="goldSuggestion" :suggestion="goldSuggestion" size="gold" />
      <PodiumCard v-if="bronzeSuggestion" :suggestion="bronzeSuggestion" size="bronze" />
    </div>

    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; margin-top: 34px">
      <a
        v-if="goldSuggestion"
        :href="`https://store.steampowered.com/app/${goldSuggestion.appid}/`"
        target="_blank"
        rel="noopener"
        class="results-btn results-btn--primary"
        style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 26px;
          border-radius: 11px;
          border: 1px solid var(--acc);
          background: var(--acc);
          color: var(--accink);
          font-size: 15px;
          font-weight: 600;
        "
      >
        <span style="font: 400 11px Silkscreen, monospace">▶</span>Lancer {{ goldSuggestion.name }}
      </a>
      <button
        type="button"
        class="results-btn"
        style="
          padding: 15px 22px;
          border-radius: 11px;
          border: 1px solid var(--bord);
          background: var(--surf);
          color: var(--tx2);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14.5px;
          cursor: pointer;
        "
        @click="retry"
      >
        Relancer une suggestion
      </button>
      <button
        type="button"
        class="results-btn results-btn--ghost"
        style="
          padding: 15px 22px;
          border-radius: 11px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--tx2);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14.5px;
          cursor: pointer;
        "
        @click="editCriteria"
      >
        Modifier mes critères
      </button>
    </div>
  </section>
</template>

<style scoped>
.results-btn:hover {
  border-color: var(--acc);
  color: var(--acc);
}
.results-btn--primary:hover {
  transform: translateY(-2px);
  color: var(--accink);
}
.results-btn--ghost:hover {
  color: var(--acc);
}
</style>
