// Configuration semantic-release (voir section "Commits et changelog" de
// CLAUDE.md). Ne tourne que sur `main` (job `release` de
// .github/workflows/ci.yml) : chaque push avec des commits feat/fix/perf
// depuis le dernier tag y declenche un tag git et une GitHub Release, sans
// etape manuelle.
//
// Pas de @semantic-release/git ni @semantic-release/changelog : ces plugins
// pousseraient un commit directement sur `main`, or ce depot a un ruleset
// GitHub sur `main` qui l'interdit (PR obligatoire + statuts requis, voir
// https://github.com/Mvth1s/Ce-Soir-Je-Joue-A/rules), constate le 2026-08-07
// (le job `release` echouait avec "GH013: Repository rule violations"). La
// GitHub Release creee par @semantic-release/github passe par l'API REST
// (POST /releases), pas par un `git push` sur la branche protegee, donc n'est
// pas concernee. front/public/CHANGELOG.md est donc regenere a chaque
// deploiement (job deploy-production) a partir des GitHub Releases publiees,
// voir scripts/generate-changelog.ts - jamais commit.
//
// Pas de plugin @semantic-release/npm : ce depot n'est pas un paquet publie
// (pas de consommateurs suivant une version dans package.json), le tag git
// et la GitHub Release suffisent comme source de verite de version.
module.exports = {
  branches: ["main"],
  repositoryUrl: "https://github.com/Mvth1s/Ce-Soir-Je-Joue-A",
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    "./scripts/semantic-release/generate-notes.cjs",
    [
      "@semantic-release/github",
      {
        successComment: false,
        failComment: false,
      },
    ],
  ],
};
