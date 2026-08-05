// Garde-fou avant mise en ligne : verifie que la page des mentions legales
// (qui couvre aussi les donnees personnelles, voir docs/01-cahier-des-charges.md,
// section RGPD) existe toujours, est routee, et n'a pas ete videe par erreur.
// Ne verifie pas le fond du contenu, seulement sa presence (voir CLAUDE.md :
// toute nouvelle donnee utilisateur stockee doit rester documentee ici).
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const LEGAL_PAGE_PATH = join(ROOT, "front/src/pages/MentionsLegalesPage.vue");
const ROUTER_PATH = join(ROOT, "front/src/router/index.ts");
const MIN_TEXT_LENGTH = 200;
const REQUIRED_KEYWORDS = ["Données personnelles", "SteamID64", "Éditeur"];

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function fail(message: string): never {
  console.error(`[check-legal-pages] ${message}`);
  process.exit(1);
}

function main(): void {
  let legalPageSource: string;
  try {
    legalPageSource = readFileSync(LEGAL_PAGE_PATH, "utf-8");
  } catch {
    fail(`page introuvable : ${LEGAL_PAGE_PATH}`);
  }

  const templateMatch = /<template>([\s\S]*)<\/template>/.exec(legalPageSource!);
  if (!templateMatch) {
    fail("aucun <template> trouve dans la page des mentions legales");
  }

  const text = stripTags(templateMatch![1]!);
  if (text.length < MIN_TEXT_LENGTH) {
    fail(`contenu trop court (${text.length} caracteres, minimum ${MIN_TEXT_LENGTH})`);
  }

  const missingKeywords = REQUIRED_KEYWORDS.filter((keyword) => !text.includes(keyword));
  if (missingKeywords.length > 0) {
    fail(`section(s) manquante(s) dans les mentions legales : ${missingKeywords.join(", ")}`);
  }

  const routerSource = readFileSync(ROUTER_PATH, "utf-8");
  if (!routerSource.includes("/mentions-legales")) {
    fail("la route /mentions-legales n'est plus declaree dans front/src/router/index.ts");
  }

  console.log("[check-legal-pages] OK : page des mentions legales presente, routee et non vide.");
}

main();
