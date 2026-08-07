// Regenere front/public/CHANGELOG.md a partir des commits conventionnels
// (voir commitlint.config.js : type(scope): sujet, impose par le hook
// commit-msg de husky et verifie en CI). Le projet ne fait pas de versioning
// semver (pas de tags, pas de semantic-release, decision volontaire - voir
// discussion dans l'historique), donc pas de decoupage par version : juste
// les entrees pertinentes pour l'utilisateur, du plus recent au plus ancien.
//
// Ne garde que feat/fix/perf (les autres types sont de la plomberie interne,
// pas des changements visibles), et exclut en plus les scopes purement
// techniques (ci, e2e, test, deploy, dependabot) meme quand ils sont
// feat/fix/perf : "fix(ci): ..." ne signifie rien pour un joueur.
//
// Lance a chaque deploiement production, voir le job deploy-production dans
// .github/workflows/ci.yml. Peut aussi etre lance manuellement : `pnpm changelog`.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_URL = "https://github.com/Mvth1s/Ce-Soir-Je-Joue-A";
const OUT_PATH = resolve(__dirname, "../front/public/CHANGELOG.md");

const SECTIONS: { type: string; title: string }[] = [
  { type: "feat", title: "Nouveautés" },
  { type: "fix", title: "Corrections" },
  { type: "perf", title: "Performance" },
];

const EXCLUDED_SCOPES = new Set(["ci", "e2e", "test", "deploy", "dependabot"]);

// Groupes nommes plutot que positionnels : sous noUncheckedIndexedAccess
// (voir tsconfig.base.json), un acces positionnel sur RegExpExecArray type
// chaque element en `string | undefined`, meme les groupes non-optionnels.
// Le "!" optionnel avant les ":" (breaking change) est tolere mais ignore.
const COMMIT_PATTERN = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?!?:\s*(?<subject>.+)$/;

interface Entry {
  type: string;
  scope?: string;
  subject: string;
  hash: string;
}

function readEntries(): Entry[] {
  const log = execFileSync("git", ["log", "--no-merges", "--pretty=format:%h%x1f%s"], {
    encoding: "utf8",
  });

  const entries: Entry[] = [];
  for (const line of log.split("\n")) {
    if (!line) continue;
    const [hash, subject] = line.split("\x1f");
    const match = COMMIT_PATTERN.exec(subject ?? "");
    if (!match?.groups) continue;
    const { type, scope, subject: message } = match.groups;
    // type et subject sont des groupes obligatoires dans COMMIT_PATTERN :
    // toujours definis quand match reussit, malgre le typage
    // `string | undefined` que noUncheckedIndexedAccess impose ici.
    if (!type || !message) continue;
    if (!SECTIONS.some((section) => section.type === type)) continue;
    if (scope && EXCLUDED_SCOPES.has(scope)) continue;
    entries.push({ type, scope, subject: message, hash: hash ?? "" });
  }
  return entries;
}

function render(entries: Entry[]): string {
  const lines = [
    "# Changelog",
    "",
    "Généré automatiquement à partir de l'historique des commits (voir `scripts/generate-changelog.ts`).",
  ];

  let hasSection = false;
  for (const { type, title } of SECTIONS) {
    const matching = entries.filter((entry) => entry.type === type);
    if (matching.length === 0) continue;
    hasSection = true;

    lines.push("", `## ${title}`, "");
    for (const entry of matching) {
      const scopePrefix = entry.scope ? `**${entry.scope}:** ` : "";
      lines.push(`- ${scopePrefix}${entry.subject} ([${entry.hash}](${REPO_URL}/commit/${entry.hash}))`);
    }
  }

  if (!hasSection) {
    lines.push("", "_Rien à afficher pour le moment._");
  }

  return lines.join("\n") + "\n";
}

const entries = readEntries();
writeFileSync(OUT_PATH, render(entries));
console.log(`Changelog genere : ${OUT_PATH} (${entries.length} entree(s))`);
