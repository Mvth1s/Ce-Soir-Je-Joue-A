// Convention deja largement suivie dans l'historique du depot (fix(ci): ...,
// docs: ..., build(deps): ... genere par Dependabot) : on la rend explicite
// et obligatoire plutot que d'ajouter une nouvelle regle. Verifie localement
// par le hook commit-msg de husky (.husky/commit-msg) et en CI sur chaque PR
// (job commitlint dans .github/workflows/ci.yml). Sert aussi de source pour
// le versioning et le changelog auto-generes par semantic-release, voir
// release.config.js.
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
