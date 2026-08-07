// Regenere front/public/CHANGELOG.md a partir des GitHub Releases publiees
// (voir release.config.js : semantic-release cree un tag + une GitHub
// Release a chaque commit feat/fix/perf sur main, mais ne peut pas commiter
// directement le fichier sur `main`, protegee par un ruleset GitHub - PR
// obligatoire, voir le commentaire en tete de release.config.js). Chaque
// release porte deja des notes au format attendu par
// front/src/pages/ChangelogPage.vue (genere par
// scripts/semantic-release/generate-notes.cjs) : ce script se contente de
// les concatener, sans reparser les commits.
//
// Lance a chaque deploiement production, voir le job deploy-production dans
// .github/workflows/ci.yml. Peut aussi etre lance manuellement : `pnpm changelog`.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = "Mvth1s/Ce-Soir-Je-Joue-A";
const OUT_PATH = resolve(__dirname, "../front/public/CHANGELOG.md");

interface GithubRelease {
  body: string | null;
  draft: boolean;
  prerelease: boolean;
}

async function fetchReleases(): Promise<GithubRelease[]> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  // Optionnel : sans token, l'API GitHub reste utilisable pour un depot
  // public (juste plus limitee en frequence), utile pour lancer ce script en
  // local sans configuration. En CI, GITHUB_TOKEN evite le rate-limit bas
  // reserve aux appels anonymes.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers });
  if (!res.ok) throw new Error(`Echec de l'appel a l'API GitHub (releases) : ${res.status}`);
  return (await res.json()) as GithubRelease[];
}

function render(releases: GithubRelease[]): string {
  const bodies = releases
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => (release.body ?? "").trim())
    .filter(Boolean);

  const lines = ["# Changelog", ""];
  if (bodies.length === 0) {
    lines.push("_Rien à afficher pour le moment._");
  } else {
    lines.push(bodies.join("\n\n"));
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const releases = await fetchReleases();
  writeFileSync(OUT_PATH, render(releases));
  console.log(`Changelog genere : ${OUT_PATH} (${releases.length} release(s))`);
}

main();
