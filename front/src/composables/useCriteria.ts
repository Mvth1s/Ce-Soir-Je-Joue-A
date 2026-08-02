import { computed, reactive } from "vue";

export type MoodId =
  | "detente"
  | "defi"
  | "social"
  | "decouverte"
  | "nostalgie"
  | "creatif";
export type FatigueId = "frais" | "cava" | "fatigue" | "crame";
export type TimeId = "30" | "60" | "120" | "180";
export type MomentId = "matin" | "aprem" | "soiree" | "nuit";

export const MOODS: { id: MoodId; label: string; glyph: string }[] = [
  { id: "detente", label: "Détente", glyph: "●" },
  { id: "defi", label: "Défi", glyph: "▲" },
  { id: "social", label: "Social", glyph: "◆" },
  { id: "decouverte", label: "Découverte", glyph: "★" },
  { id: "nostalgie", label: "Nostalgie", glyph: "✦" },
  { id: "creatif", label: "Créatif", glyph: "■" },
];

export const FATIGUES: { id: FatigueId; label: string; bars: string }[] = [
  { id: "frais", label: "Frais", bars: "▮▮▮▮" },
  { id: "cava", label: "Ça va", bars: "▮▮▮" },
  { id: "fatigue", label: "Fatigué", bars: "▮▮" },
  { id: "crame", label: "Cramé", bars: "▮" },
];

export const TIMES: { id: TimeId; label: string }[] = [
  { id: "30", label: "~30 min" },
  { id: "60", label: "~1 h" },
  { id: "120", label: "~2 h" },
  { id: "180", label: "3 h et +" },
];

export const MOMENTS: { id: MomentId; label: string }[] = [
  { id: "matin", label: "Matin" },
  { id: "aprem", label: "Après-midi" },
  { id: "soiree", label: "Soirée" },
  { id: "nuit", label: "Nuit" },
];

function momentFromHour(hour: number): MomentId {
  if (hour < 12) return "matin";
  if (hour < 18) return "aprem";
  if (hour < 23) return "soiree";
  return "nuit";
}

const now = new Date();

const state = reactive({
  moods: ["detente", "nostalgie"] as MoodId[],
  fatigue: "fatigue" as FatigueId,
  time: "60" as TimeId,
  moment: momentFromHour(now.getHours()) as MomentId,
  momentAutoLabel:
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0"),
});

export function useCriteria() {
  function toggleMood(id: MoodId) {
    const i = state.moods.indexOf(id);
    if (i === -1) state.moods.push(id);
    else state.moods.splice(i, 1);
  }

  const summary = computed(() => {
    const moodLabels = MOODS.filter((m) => state.moods.includes(m.id)).map(
      (m) => m.label,
    );
    return [
      moodLabels.length ? moodLabels.join(" + ") : "aucune humeur",
      FATIGUES.find((f) => f.id === state.fatigue)?.label,
      TIMES.find((t) => t.id === state.time)?.label,
      MOMENTS.find((m) => m.id === state.moment)?.label,
    ]
      .filter(Boolean)
      .join(" · ");
  });

  return { state, toggleMood, summary };
}
