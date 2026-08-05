<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  FATIGUES,
  MOMENTS,
  MOODS,
  TIMES,
  useCriteria,
} from "@/composables/useCriteria";

interface LibraryResponse {
  count: number;
  usingFreeGames: boolean;
}

interface OptionVisual {
  border: string;
  bg: string;
  color: string;
  icon: string;
}

const router = useRouter();
const { state, toggleMood, summary } = useCriteria();

const library = reactive({
  loading: true,
  count: null as number | null,
  usingFreeGames: false,
  error: null as string | null,
});

function optionVisual(active: boolean): OptionVisual {
  return active
    ? {
        border: "var(--acc)",
        bg: "color-mix(in oklch, var(--acc) 12%, transparent)",
        color: "var(--tx)",
        icon: "var(--acc)",
      }
    : {
        border: "var(--bord)",
        bg: "var(--surf)",
        color: "var(--tx2)",
        icon: "var(--tx3)",
      };
}

const moodItems = computed(() =>
  MOODS.map((m) => ({
    ...m,
    active: state.moods.includes(m.id),
    visual: optionVisual(state.moods.includes(m.id)),
  })),
);

const fatigueItems = computed(() =>
  FATIGUES.map((f) => ({
    ...f,
    active: state.fatigue === f.id,
    visual: optionVisual(state.fatigue === f.id),
  })),
);

const timeItems = computed(() =>
  TIMES.map((t) => ({
    ...t,
    active: state.time === t.id,
    visual: optionVisual(state.time === t.id),
  })),
);

const momentItems = computed(() =>
  MOMENTS.map((m) => ({
    ...m,
    active: state.moment === m.id,
    visual: optionVisual(state.moment === m.id),
  })),
);

const subtitle = computed(() => {
  if (library.loading) return "Chargement de votre bibliothèque…";
  if (library.error) return "Impossible de charger votre bibliothèque pour le moment.";
  if (library.usingFreeGames) {
    return "Votre bibliothèque Steam est vide : on vous propose des jeux gratuits pour ce soir.";
  }
  if (library.count !== null) {
    return `${library.count.toLocaleString("fr-FR")} jeux dans votre bibliothèque. Réduisons ça à trois.`;
  }
  return "";
});

async function loadLibrary() {
  try {
    const res = await fetch("/api/library");
    if (res.status === 401) {
      router.push("/connexion");
      return;
    }
    if (!res.ok) {
      library.error = "http_error";
      library.loading = false;
      return;
    }
    const data = (await res.json()) as LibraryResponse;
    library.count = data.count;
    library.usingFreeGames = data.usingFreeGames;
    library.loading = false;
  } catch {
    library.error = "network_error";
    library.loading = false;
  }
}

function goHome() {
  router.push("/");
}

function goResults() {
  router.push("/resultats");
}

onMounted(loadLibrary);
</script>

<template>
  <section
    style="
      flex: 1;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      padding: clamp(26px, 5vw, 40px) clamp(20px, 5vw, 40px);
      display: flex;
      flex-direction: column;
      gap: 30px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <div style="display: flex; flex-direction: column; gap: 6px">
      <h2
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(28px, 5vw, 36px);
          color: var(--tx);
        "
      >
        Où en êtes-vous, ce soir ?
      </h2>
      <p style="margin: 0; font-size: 15px; color: var(--tx2)">{{ subtitle }}</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap">
        <span style="font-size: 14px; font-weight: 600; color: var(--tx)">HUMEUR</span>
        <span style="font-size: 13px; color: var(--tx3)">plusieurs choix possibles</span>
      </div>
      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 11px;
        "
      >
        <button
          v-for="m in moodItems"
          :key="m.id"
          type="button"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '15px 14px',
            borderRadius: '11px',
            border: `1px solid ${m.visual.border}`,
            background: m.visual.bg,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14.5px',
            fontWeight: 600,
            color: m.visual.color,
            cursor: 'pointer',
            textAlign: 'left',
          }"
          @click="toggleMood(m.id)"
        >
          <span :style="{ font: '400 15px Silkscreen, monospace', color: m.visual.icon }">{{
            m.glyph
          }}</span>
          {{ m.label }}
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 26px">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <span style="font-size: 14px; font-weight: 600; color: var(--tx)">FATIGUE</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
          <button
            v-for="f in fatigueItems"
            :key="f.id"
            type="button"
            :style="{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '13px 4px',
              borderRadius: '10px',
              border: `1px solid ${f.visual.border}`,
              background: f.visual.bg,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '13.5px',
              fontWeight: 600,
              color: f.visual.color,
              cursor: 'pointer',
            }"
            @click="state.fatigue = f.id"
          >
            <span :style="{ font: '400 11px Silkscreen, monospace', color: f.visual.icon }">{{
              f.bars
            }}</span>
            {{ f.label }}
          </button>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <span style="font-size: 14px; font-weight: 600; color: var(--tx)">TEMPS DISPONIBLE</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
          <button
            v-for="t in timeItems"
            :key="t.id"
            type="button"
            :style="{
              display: 'flex',
              justifyContent: 'center',
              padding: '15px 4px',
              borderRadius: '10px',
              border: `1px solid ${t.visual.border}`,
              background: t.visual.bg,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: t.visual.color,
              cursor: 'pointer',
            }"
            @click="state.time = t.id"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap">
        <span style="font-size: 14px; font-weight: 600; color: var(--tx)">MOMENT DE LA JOURNÉE</span>
        <span
          style="
            padding: 3px 8px;
            border-radius: 5px;
            background: color-mix(in oklch, var(--acc) 18%, transparent);
            font: 400 10.5px Silkscreen, monospace;
            color: var(--acc);
          "
          >auto · {{ state.momentAutoLabel }}</span
        >
      </div>
      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 8px;
        "
      >
        <button
          v-for="mo in momentItems"
          :key="mo.id"
          type="button"
          :style="{
            display: 'flex',
            justifyContent: 'center',
            padding: '15px 4px',
            borderRadius: '10px',
            border: `1px solid ${mo.visual.border}`,
            background: mo.visual.bg,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: mo.visual.color,
            cursor: 'pointer',
          }"
          @click="state.moment = mo.id"
        >
          {{ mo.label }}
        </button>
      </div>
    </div>

    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: 22px;
        border-top: 1px solid var(--bord);
      "
    >
      <span style="font-size: 13.5px; color: var(--tx2)">{{ summary }}</span>
      <div style="display: flex; gap: 10px">
        <button
          type="button"
          class="criteria-btn"
          style="
            padding: 16px 22px;
            border-radius: 11px;
            border: 1px solid var(--bord);
            background: var(--surf);
            color: var(--tx2);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 15.5px;
            cursor: pointer;
          "
          @click="goHome"
        >
          Retour
        </button>
        <button
          type="button"
          class="criteria-submit-btn"
          style="
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 16px 28px;
            border-radius: 11px;
            border: 1px solid var(--acc);
            background: var(--acc);
            color: var(--accink);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 16.5px;
            font-weight: 600;
            cursor: pointer;
          "
          @click="goResults"
        >
          Trouver mes 3 jeux<span style="font: 400 13px Silkscreen, monospace">▶</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.criteria-btn:hover {
  border-color: var(--acc);
  color: var(--acc);
}
.criteria-submit-btn:hover {
  transform: translateY(-2px);
}
</style>
