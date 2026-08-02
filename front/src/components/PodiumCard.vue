<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

export type PodiumSize = "gold" | "silver" | "bronze";

export interface PodiumMatch {
  percent: number;
  whyThisGame: string;
  whyThisRank: string;
}

export interface PodiumSuggestion {
  rank: 1 | 2 | 3;
  appid: number;
  name: string;
  playtimeForeverMinutes: number;
  lastPlayedAt: string | null;
  posterUrl: string | null;
  match: PodiumMatch | null;
}

const props = defineProps<{
  suggestion: PodiumSuggestion;
  size: PodiumSize;
}>();

const flipped = ref(false);
const isTouch = ref(false);
const posterLoaded = ref(false);

onMounted(() => {
  isTouch.value = window.matchMedia("(hover: none)").matches;
});

const steamUrl = computed(
  () => `https://store.steampowered.com/app/${props.suggestion.appid}/`,
);

// Sur mobile il n'y a pas de survol : le premier tap retourne la carte, le second suit le lien.
function handleClick(event: MouseEvent) {
  if (!isTouch.value || flipped.value) return;
  event.preventDefault();
  flipped.value = true;
}

const RANK_LABELS: Record<1 | 2 | 3, string> = {
  1: "pourquoi la 1re place",
  2: "pourquoi la 2e place",
  3: "pourquoi la 3e place",
};
const whyRankLabel = computed(() => RANK_LABELS[props.suggestion.rank]);

const playtimeLabel = computed(() => {
  const minutes = props.suggestion.playtimeForeverMinutes;
  if (minutes <= 0) return "Jamais lancé";
  const hours = Math.round(minutes / 60);
  if (hours < 1) return "< 1 h jouée";
  return `${hours} h jouées`;
});

function formatRelativeDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `il y a ${diffMonths} mois`;
  const diffYears = Math.round(diffDays / 365);
  return `il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
}

const lastPlayedLabel = computed(() =>
  props.suggestion.lastPlayedAt ? formatRelativeDate(props.suggestion.lastPlayedAt) : null,
);

const showHoverHint = computed(() => props.size === "gold" && !isTouch.value);
</script>

<template>
  <a
    class="podium-card"
    :class="{ 'is-flipped': flipped }"
    :data-size="size"
    :href="steamUrl"
    target="_blank"
    rel="noopener"
    @click="handleClick"
  >
    <div class="podium-card__inner">
      <div class="podium-card__face podium-card__face--front">
        <div class="podium-card__surface">
          <span class="podium-card__badge">{{ suggestion.rank }}</span>
          <div class="podium-card__poster">
            <img
              v-if="suggestion.posterUrl"
              :src="suggestion.posterUrl"
              :alt="suggestion.name"
              class="podium-card__poster-img"
              :class="{ 'podium-card__poster-img--loaded': posterLoaded }"
              fetchpriority="high"
              decoding="async"
              @load="posterLoaded = true"
            />
            <div v-if="suggestion.posterUrl" class="podium-card__poster-overlay"></div>
            <span v-if="!suggestion.posterUrl" class="podium-card__poster-label">affiche steam</span>
            <span
              class="podium-card__title"
              :class="{ 'podium-card__title--on-image': suggestion.posterUrl }"
              >{{ suggestion.name }}</span
            >
          </div>
          <div class="podium-card__stats">
            <div v-if="suggestion.match" class="podium-card__stats-row">
              <span class="podium-card__percent">{{ suggestion.match.percent }} %</span>
              <span class="podium-card__playtime">{{ playtimeLabel }}</span>
            </div>
            <div v-if="suggestion.match" class="podium-card__bar">
              <div class="podium-card__bar-fill" :style="{ width: suggestion.match.percent + '%' }"></div>
            </div>
            <span v-else class="podium-card__playtime">{{ playtimeLabel }}</span>
            <div v-if="lastPlayedLabel || showHoverHint" class="podium-card__stats-bottom">
              <span v-if="lastPlayedLabel" class="podium-card__lastplayed"
                >Dernière session {{ lastPlayedLabel }}</span
              >
              <span v-if="showHoverHint" class="podium-card__hint">survolez ▸</span>
            </div>
          </div>
        </div>
      </div>

      <div class="podium-card__face podium-card__face--back">
        <div class="podium-card__surface podium-card__surface--back">
          <div class="podium-card__back-header">
            <span class="podium-card__back-title">{{ suggestion.name }}</span>
            <span v-if="suggestion.match" class="podium-card__percent">{{ suggestion.match.percent }} %</span>
          </div>
          <div class="podium-card__back-body">
            <template v-if="suggestion.match">
              <div class="podium-card__why">
                <span class="podium-card__why-label">pourquoi ce jeu</span>
                <p class="podium-card__why-text">{{ suggestion.match.whyThisGame }}</p>
              </div>
              <div class="podium-card__why">
                <span class="podium-card__why-label">{{ whyRankLabel }}</span>
                <p class="podium-card__why-text">{{ suggestion.match.whyThisRank }}</p>
              </div>
            </template>
            <div v-else class="podium-card__why">
              <span class="podium-card__why-label">jeu gratuit</span>
              <p class="podium-card__why-text">
                Jeu gratuit suggéré : votre bibliothèque Steam était vide.
              </p>
            </div>
            <span class="podium-card__back-hint"
              >clic ▸ {{ size === "gold" ? "ouvrir la fiche steam" : "fiche steam" }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </a>
</template>

<style scoped>
.podium-card {
  display: block;
  position: relative;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  animation: riseIn 0.5s backwards cubic-bezier(0.2, 0.7, 0.3, 1);
}
.podium-card[data-size="gold"] {
  width: min(300px, 88vw);
  height: min(576px, 150vw);
  perspective: 1500px;
  animation-duration: 0.55s;
}
.podium-card[data-size="silver"] {
  width: min(300px, 88vw);
  height: min(452px, 86vw);
  perspective: 1300px;
  animation-delay: 0.12s;
}
.podium-card[data-size="bronze"] {
  width: min(300px, 88vw);
  height: min(408px, 86vw);
  perspective: 1300px;
  animation-delay: 0.24s;
}

.podium-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1);
  transform-style: preserve-3d;
}
.podium-card:hover .podium-card__inner,
.podium-card.is-flipped .podium-card__inner {
  transform: rotateY(180deg);
}

.podium-card__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  padding: 3px;
}
.podium-card__face--back {
  transform: rotateY(180deg);
}
[data-size="gold"] .podium-card__face {
  border-radius: 16px;
  background: var(--goldbg);
  box-shadow:
    0 22px 52px color-mix(in oklch, var(--gold) 22%, transparent),
    0 12px 30px rgba(0, 0, 0, 0.32);
}
[data-size="silver"] .podium-card__face {
  border-radius: 14px;
  background: var(--silverbg);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
}
[data-size="bronze"] .podium-card__face {
  border-radius: 14px;
  background: var(--bronzebg);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.26);
}

.podium-card__surface {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--surf);
  display: flex;
  flex-direction: column;
}
[data-size="gold"] .podium-card__surface {
  border-radius: 13px;
}
[data-size="silver"] .podium-card__surface,
[data-size="bronze"] .podium-card__surface {
  border-radius: 11px;
}

.podium-card__badge {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  font-family: "Silkscreen", monospace;
  font-weight: 700;
}
[data-size="gold"] .podium-card__badge {
  top: 12px;
  left: 12px;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--goldbg);
  font-size: 13px;
  color: #3d2b13;
}
[data-size="silver"] .podium-card__badge {
  top: 10px;
  left: 10px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--silverbg);
  font-size: 11px;
  color: #2f2825;
}
[data-size="bronze"] .podium-card__badge {
  top: 10px;
  left: 10px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--bronzebg);
  font-size: 10px;
  color: #37220f;
}

.podium-card__poster {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--posterbg);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-bottom: 1px solid var(--bord);
}
[data-size="gold"] .podium-card__poster {
  padding: 20px;
}
[data-size="silver"] .podium-card__poster {
  padding: 14px;
}
[data-size="bronze"] .podium-card__poster {
  padding: 13px;
}

.podium-card__poster-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.podium-card__poster-img--loaded {
  opacity: 1;
}
.podium-card__poster-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.75));
}
.podium-card__poster-label {
  position: relative;
  z-index: 1;
  font: 400 9px Silkscreen, monospace;
  color: var(--tx3);
}
.podium-card__title {
  position: relative;
  z-index: 1;
  font-family: "Pixelify Sans", monospace;
  font-weight: 600;
  line-height: 1.1;
  color: var(--tx);
}
.podium-card__title--on-image {
  color: #f6ebe1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
[data-size="gold"] .podium-card__title {
  font-size: clamp(26px, 6vw, 32px);
}
[data-size="silver"] .podium-card__title {
  font-size: 21px;
}
[data-size="bronze"] .podium-card__title {
  font-size: 18px;
}

.podium-card__stats {
  display: flex;
  flex-direction: column;
}
[data-size="gold"] .podium-card__stats {
  gap: 9px;
  padding: 17px 19px 19px;
}
[data-size="silver"] .podium-card__stats {
  gap: 7px;
  padding: 13px 14px 15px;
}
[data-size="bronze"] .podium-card__stats {
  gap: 7px;
  padding: 12px 13px 14px;
}

.podium-card__stats-row,
.podium-card__stats-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.podium-card__percent {
  font-family: "Silkscreen", monospace;
  font-weight: 700;
}
[data-size="gold"] .podium-card__percent {
  font-size: 13px;
  color: var(--gold);
}
[data-size="silver"] .podium-card__percent {
  font-size: 10px;
  color: var(--silver);
}
[data-size="bronze"] .podium-card__percent {
  font-size: 10px;
  color: var(--bronze);
}

.podium-card__playtime,
.podium-card__lastplayed {
  color: var(--tx2);
}
[data-size="gold"] .podium-card__playtime {
  font-size: 12.5px;
}
[data-size="gold"] .podium-card__lastplayed {
  font-size: 12px;
}
[data-size="silver"] .podium-card__playtime,
[data-size="silver"] .podium-card__lastplayed,
[data-size="bronze"] .podium-card__playtime,
[data-size="bronze"] .podium-card__lastplayed {
  font-size: 11.5px;
}

.podium-card__bar {
  overflow: hidden;
  background: var(--bord);
}
[data-size="gold"] .podium-card__bar {
  height: 5px;
  border-radius: 3px;
}
[data-size="silver"] .podium-card__bar,
[data-size="bronze"] .podium-card__bar {
  height: 4px;
  border-radius: 2px;
}
.podium-card__bar-fill {
  height: 100%;
}
[data-size="gold"] .podium-card__bar-fill {
  background: var(--gold);
}
[data-size="silver"] .podium-card__bar-fill {
  background: var(--silver);
}
[data-size="bronze"] .podium-card__bar-fill {
  background: var(--bronze);
}

.podium-card__hint {
  font: 400 9px Silkscreen, monospace;
  white-space: nowrap;
}
[data-size="gold"] .podium-card__hint {
  color: var(--gold);
}

.podium-card__surface--back {
  gap: 0;
}
.podium-card__back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
[data-size="gold"] .podium-card__back-header {
  padding: 16px 19px;
  border-bottom: 1px solid var(--bord);
  background: var(--surf2);
}
[data-size="silver"] .podium-card__back-header {
  padding: 15px 15px 0;
}
[data-size="bronze"] .podium-card__back-header {
  padding: 14px 14px 0;
}
.podium-card__back-title {
  font-family: "Pixelify Sans", monospace;
  font-weight: 600;
  color: var(--tx);
}
[data-size="gold"] .podium-card__back-title {
  font-size: 19px;
}
[data-size="silver"] .podium-card__back-title {
  font-size: 16px;
}
[data-size="bronze"] .podium-card__back-title {
  font-size: 15px;
}

.podium-card__back-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
}
[data-size="gold"] .podium-card__back-body {
  padding: 20px 19px;
  gap: 16px;
}
[data-size="silver"] .podium-card__back-body {
  padding: 13px 15px 15px;
  gap: 13px;
}
[data-size="bronze"] .podium-card__back-body {
  padding: 12px 14px 14px;
  gap: 12px;
}

.podium-card__why {
  display: flex;
  flex-direction: column;
}
[data-size="gold"] .podium-card__why {
  gap: 7px;
}
[data-size="silver"] .podium-card__why {
  gap: 6px;
}
[data-size="bronze"] .podium-card__why {
  gap: 5px;
}
.podium-card__why-label {
  font-family: "Silkscreen", monospace;
  font-weight: 700;
  color: var(--acc);
}
[data-size="gold"] .podium-card__why-label {
  font-size: 9px;
  letter-spacing: 0.5px;
}
[data-size="silver"] .podium-card__why-label,
[data-size="bronze"] .podium-card__why-label {
  font-size: 8.5px;
}
.podium-card__why-text {
  margin: 0;
  color: var(--tx2);
}
[data-size="gold"] .podium-card__why-text {
  font-size: 13px;
  line-height: 1.6;
}
[data-size="silver"] .podium-card__why-text {
  font-size: 12.5px;
  line-height: 1.55;
}
[data-size="bronze"] .podium-card__why-text {
  font-size: 12px;
  line-height: 1.5;
}

.podium-card__back-hint {
  margin-top: auto;
  font: 400 8.5px Silkscreen, monospace;
  color: var(--tx3);
}
</style>
