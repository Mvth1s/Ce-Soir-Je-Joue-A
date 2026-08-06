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

// Format produit par scripts/generate-changelog.ts, connu et fixe (pas un
// parseur markdown generique) : "## Titre" pour une section, et
// "- **scope:** sujet ([hash](url))" (le scope est optionnel) pour une entree.
const SECTION_PATTERN = /^## (.+)$/;
const ITEM_PATTERN =
  /^- (?:\*\*(?<scope>[^*]+):\*\* )?(?<subject>.+) \(\[(?<hash>[0-9a-f]+)\]\((?<url>[^)]+)\)\)$/;

function parse(markdown: string): ChangelogSection[] {
  const sections: ChangelogSection[] = [];
  let current: ChangelogSection | null = null;

  for (const line of markdown.split("\n")) {
    const sectionMatch = SECTION_PATTERN.exec(line);
    if (sectionMatch?.[1]) {
      current = { title: sectionMatch[1], items: [] };
      sections.push(current);
      continue;
    }
    const itemMatch = ITEM_PATTERN.exec(line);
    const groups = itemMatch?.groups;
    if (groups?.subject && groups.hash && groups.url && current) {
      current.items.push({
        scope: groups.scope,
        subject: groups.subject,
        hash: groups.hash,
        url: groups.url,
      });
    }
  }
  return sections;
}

const sections = ref<ChangelogSection[]>([]);
const loading = ref(true);
const unavailable = ref(false);

onMounted(async () => {
  try {
    const res = await fetch("/CHANGELOG.md");
    if (!res.ok) throw new Error(String(res.status));
    sections.value = parse(await res.text());
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
    <p v-else-if="sections.length === 0" style="margin: 0; font-size: 13.5px; color: var(--tx3)">
      Rien à afficher pour le moment.
    </p>

    <div v-else style="display: flex; flex-direction: column; gap: 28px">
      <div
        v-for="section in sections"
        :key="section.title"
        style="display: flex; flex-direction: column; gap: 10px"
      >
        <h2
          style="
            margin: 0;
            font-family: 'Pixelify Sans', monospace;
            font-weight: 600;
            font-size: 18px;
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

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>

<style scoped>
.changelog-hash:hover {
  color: var(--acc);
}
</style>
