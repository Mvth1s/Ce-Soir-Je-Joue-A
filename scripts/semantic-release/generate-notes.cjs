// Enveloppe @semantic-release/release-notes-generator pour deux raisons :
//
// 1. Exclure du changelog public les commits dont le scope est purement
//    technique (ci, e2e, test, deploy, dependabot) : "fix(ci): ..." ne
//    signifie rien pour un joueur. Le filtre agit sur context.commits avant
//    de deleguer au plugin officiel.
//
// 2. Contourner un bug de resolution de @semantic-release/release-notes-generator
//    avec `preset: "conventionalcommits"` : son chargeur interne
//    (loadChangelogConfig -> import-from-esm) resout le paquet
//    "conventional-changelog-conventionalcommits" en remontant l'arborescence
//    node_modules depuis SA PROPRE localisation profonde sous
//    node_modules/.pnpm/, et peut tomber sur une copie fantome hoistee dans
//    node_modules/.pnpm/node_modules/ (dependance transitive d'un tout autre
//    paquet du depot) au lieu de la version installee a la racine. Si cette
//    copie fantome est une version majeure plus recente que celle attendue
//    par conventional-changelog-writer@^8 (dependance directe de
//    release-notes-generator), le writer ne reconnait plus la cle
//    `mainTemplate` du preset (renommee `template` dans les versions
//    recentes) et rend un changelog vide (juste l'entete de version, aucune
//    section). Constate le 2026-08-07 avec conventional-changelog-writer@8.4.0
//    + conventional-changelog-conventionalcommits@10.2.1 hoiste en fantome,
//    alors que la racine du depot avait bien conventional-changelog-conventionalcommits@9.3.1
//    en dependance directe. Contournement : resoudre nous-memes le preset
//    depuis ce fichier (dont la resolution node_modules part de la racine du
//    depot, avant d'atteindre le magasin virtuel pnpm) et passer directement
//    `parserOpts`/`writerOpts` a generateNotes plutot que l'option `preset`.
//
// Fichier en CommonJS (.cjs) : semantic-release charge les plugins via
// require() sans passer par tsx, et scripts/**/*.ts n'est de toute facon pas
// concu pour tourner hors Node pur (voir back/tsconfig.json, qui n'inclut
// que .ts).
const { generateNotes } = require("@semantic-release/release-notes-generator");

const EXCLUDED_SCOPES = new Set(["ci", "e2e", "test", "deploy", "dependabot"]);

// context.commits ne porte pas encore de champ `scope` a ce stade (seul
// commit-analyzer parse les commits, sans reecrire le tableau partage) :
// on reparse nous-memes juste le scope depuis la premiere ligne, avec le
// meme motif que commitlint.config.js impose (type(scope): sujet).
const HEADER_PATTERN = /^\w+\((?<scope>[^)]+)\)!?:/;

const presetConfig = {
  types: [
    { type: "feat", section: "Nouveautés" },
    { type: "fix", section: "Corrections" },
    { type: "perf", section: "Performance" },
  ],
};

module.exports = {
  generateNotes: async (pluginConfig, context) => {
    const { default: conventionalcommits } = await import("conventional-changelog-conventionalcommits");
    const config = await conventionalcommits(presetConfig);

    const commits = context.commits.filter((commit) => {
      const scope = HEADER_PATTERN.exec(commit.message.split("\n")[0])?.groups?.scope;
      return !(scope && EXCLUDED_SCOPES.has(scope));
    });

    return generateNotes(
      { parserOpts: config.parser, writerOpts: config.writer },
      { ...context, commits },
    );
  },
};
