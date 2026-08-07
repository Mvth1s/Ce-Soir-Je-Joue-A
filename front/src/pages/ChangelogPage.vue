<script setup lang="ts">
import { onMounted, ref } from "vue";

interface ChangelogItem {
  scope?: string;
  subject: string;
  hash: string;
  url: string;
}

interface ChangelogSection {
  title: string;
  items: ChangelogItem[];
}

interface ChangelogRelease {
  version: string;
  compareUrl?: string;
  date: string;
  sections: ChangelogSection[];
}

// Format produit par release.config.js (semantic-release, voir
// scripts/semantic-release/generate-notes.cjs) : une entree "## version (date)"
// par release (avec lien de comparaison sauf pour la toute premiere), puis des
// sous-sections "### Titre" contenant des lignes
// "* **scope:** sujet ([#PR](url)) ([hash](url))" (scope et lien de PR
// optionnels, le lien de PR apparait quand le sujet du commit se termine par
// "(#123)" - format par defaut d'un squash-merge GitHub -, suivi parfois de
// references "closes #123" ignorees ici). Pas un parseur markdown generique :
// le format est fixe et connu.
const RELEASE_PATTERN = /^## (?:\[(?<version>[^\]]+)\]\((?<compareUrl>[^)]+)\)|(?<bareVersion>\S+)) \((?<date>[^)]+)\)$/;
const SECTION_PATTERN = /^### (.+)$/;
const ITEM_PATTERN =
  /^\* (?:\*\*(?<scope>[^*]+):\*\* )?(?<subject>.+?)(?: \(\[#\d+\]\([^)]+\)\))? \(\[(?<hash>[0-9a-f]+)\]\((?<url>[^)]+)\)\)/;

function parse(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let currentRelease: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const line of markdown.split("\n")) {
    const releaseMatch = RELEASE_PATTERN.exec(line);
    const releaseGroups = releaseMatch?.groups;
    if (releaseGroups && (releaseGroups.version || releaseGroups.bareVersion) && releaseGroups.date) {
      currentRelease = {
        version: releaseGroups.version ?? releaseGroups.bareVersion ?? "",
        compareUrl: releaseGroups.compareUrl,
        date: releaseGroups.date,
        sections: [],
      };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }

    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch?.[1] && currentRelease) {
      currentSection = { title: sectionMatch[1], items: [] };
      currentRelease.sections.push(currentSection);
      continue;
    }

    const itemMatch = ITEM_PATTERN.exec(line);
    const itemGroups = itemMatch?.groups;
    if (itemGroups?.subject && itemGroups.hash && itemGroups.url && currentSection) {
      currentSection.items.push({
        scope: itemGroups.scope,
        subject: itemGroups.subject,
        hash: itemGroups.hash,
        url: itemGroups.url,
      });
    }
  }
  return releases;
}

const releases = ref<ChangelogRelease[]>([]);
const loading = ref(true);
const unavailable = ref(false);

onMounted(async () => {
  try {
    const res = await fetch("/CHANGELOG.md");
    if (!res.ok) throw new Error(String(res.status));
    releases.value = parse(await res.text());
  } catch {
    unavailable.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section
    style="
      flex: 1;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      padding: clamp(40px, 6vw, 64px) clamp(20px, 5vw, 40px) 64px;
      display: flex;
      flex-direction: column;
      gap: 30px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <div style="display: flex; flex-direction: column; gap: 8px">
      <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
        >nouveautés</span
      >
      <h1
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(28px, 5vw, 38px);
          color: var(--tx);
        "
      >
        Changelog
      </h1>
    </div>

    <p v-if="loading" style="margin: 0; font-size: 13.5px; color: var(--tx3)">Chargement…</p>
    <p v-else-if="unavailable" style="margin: 0; font-size: 13.5px; color: var(--tx3)">
      Le changelog n'est pas disponible sur cet environnement.
    </p>
    <p v-else-if="releases.length === 0" style="margin: 0; font-size: 13.5px; color: var(--tx3)">
      Rien à afficher pour le moment.
    </p>

    <div v-else style="display: flex; flex-direction: column; gap: 40px">
      <div
        v-for="release in releases"
        :key="release.version"
        style="display: flex; flex-direction: column; gap: 20px"
      >
        <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap">
          <component
            :is="release.compareUrl ? 'a' : 'span'"
            :href="release.compareUrl"
            target="_blank"
            rel="noopener"
            class="changelog-version"
            style="
              font-family: 'Pixelify Sans', monospace;
              font-weight: 600;
              font-size: 20px;
              color: var(--tx);
              text-decoration: none;
            "
            >v{{ release.version }}</component
          >
          <span style="font-size: 12.5px; color: var(--tx3)">{{ release.date }}</span>
        </div>

        <div
          v-for="section in release.sections"
          :key="section.title"
          style="display: flex; flex-direction: column; gap: 10px"
        >
          <h2
            style="
              margin: 0;
              font-family: 'Pixelify Sans', monospace;
              font-weight: 600;
              font-size: 16px;
              color: var(--tx);
            "
          >
            {{ section.title }}
          </h2>
          <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px">
            <li
              v-for="item in section.items"
              :key="item.hash"
              style="font-size: 13.5px; line-height: 1.6; color: var(--tx2)"
            >
              <strong v-if="item.scope" style="color: var(--tx)">{{ item.scope }} : </strong
              >{{ item.subject }}
              <a
                :href="item.url"
                target="_blank"
                rel="noopener"
                class="changelog-hash"
                style="margin-left: 6px; font-size: 12px; color: var(--tx3)"
                >{{ item.hash }}</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>

<style scoped>
.changelog-hash:hover {
  color: var(--acc);
}
.changelog-version:hover {
  color: var(--acc);
}
</style>
