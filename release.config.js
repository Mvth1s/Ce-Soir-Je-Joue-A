// Configuration semantic-release (voir section "Commits et changelog" de
// CLAUDE.md). Ne tourne que sur `main` (job `release` de
// .github/workflows/ci.yml) : chaque push avec des commits feat/fix/perf
// depuis le dernier tag y declenche un tag git, une GitHub Release et une
// mise a jour de front/public/CHANGELOG.md, sans etape manuelle.
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
      "@semantic-release/changelog",
      {
        changelogFile: "front/public/CHANGELOG.md",
        changelogTitle: "# Changelog",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["front/public/CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        failComment: false,
      },
    ],
  ],
};
