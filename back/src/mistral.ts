// Matching IA via l'API Mistral (tier gratuit). Voir docs/02-architecture-logicielle.md
// (section "Mistral API") et la sequence de suggestion dans docs/01-cahier-des-charges.md.
//
// Note volontaire : contrairement a ce que decrit encore docs/01 ("titre, genre, temps
// joue, derniere session"), le genre n'est PAS envoye ici. La Steam Web API
// (IPlayerService/GetOwnedGames) ne fournit pas le genre sans un appel supplementaire
// couteux par jeu (IStoreService/GetAppDetails ou storefront API, un par appid). Pour
// une bibliotheque qui peut compter plusieurs centaines de jeux, ce cout n'est pas
// justifie en V1. A rediscuter avec le porteur de projet si le genre s'avere necessaire
// a la qualite du matching.
import { z } from "zod";
import type { Criteria } from "./criteria";
import type { Game, Suggestion } from "./types";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
// Modele du tier gratuit Mistral le plus proche pour ce type de tache (petit modele
// generaliste rapide). A ajuster si le nom exact change cote Mistral.
const MISTRAL_MODEL = "mistral-small-latest";
const MAX_ATTEMPTS = 2;

// Part du quota de `selectCandidates` reservee respectivement aux jeux recemment
// joues et aux jeux les plus joues, avant de completer avec le reste.
const RECENT_SHARE = 0.5;
const MOST_PLAYED_SHARE = 0.3;

// Construit une shortlist deterministe de jeux candidats a soumettre a l'IA : une
// bibliotheque Steam peut depasser 1000 jeux, on ne peut pas tout envoyer (cout,
// latence, bruit pour le modele). Priorite aux jeux reellement joues (plus
// pertinents pour matcher une humeur/nostalgie qu'un jeu jamais lance), en melant
// jeux recents et jeux tres joues pour la diversite, puis complete si besoin.
export function selectCandidates(games: Game[], limit = 40): Game[] {
  if (games.length <= limit) {
    return games;
  }

  const played = games.filter((game) => game.playtimeForeverMinutes > 0);
  const unplayed = games.filter((game) => game.playtimeForeverMinutes === 0);

  const selected = new Map<number, Game>();

  const byRecent = [...played].sort(
    (a, b) => toTimestamp(b.lastPlayedAt) - toTimestamp(a.lastPlayedAt),
  );
  const recentTarget = Math.min(limit, Math.ceil(limit * RECENT_SHARE));
  addUpTo(selected, byRecent, recentTarget);

  const byMostPlayed = [...played].sort(
    (a, b) => b.playtimeForeverMinutes - a.playtimeForeverMinutes,
  );
  const mostPlayedTarget = Math.min(limit, recentTarget + Math.ceil(limit * MOST_PLAYED_SHARE));
  addUpTo(selected, byMostPlayed, mostPlayedTarget);

  // Complete avec le reste des jeux joues, puis les jeux jamais lances si besoin,
  // dans un ordre pseudo-aleatoire mais deterministe (fonction de l'appid) : evite
  // de toujours completer avec les memes jeux (ordre d'origine) sans dependre de
  // Math.random(), qui rendrait la fonction non reproductible pour un meme input.
  const remainingPlayed = deterministicShuffle(played.filter((game) => !selected.has(game.appid)));
  addUpTo(selected, remainingPlayed, limit);

  const remainingUnplayed = deterministicShuffle(unplayed);
  addUpTo(selected, remainingUnplayed, limit);

  return [...selected.values()].slice(0, limit);
}

function addUpTo(target: Map<number, Game>, source: Game[], targetSize: number): void {
  for (const game of source) {
    if (target.size >= targetSize) {
      break;
    }
    target.set(game.appid, game);
  }
}

function toTimestamp(lastPlayedAt: string | null): number {
  return lastPlayedAt ? new Date(lastPlayedAt).getTime() : 0;
}

function deterministicShuffle(games: Game[]): Game[] {
  return [...games].sort((a, b) => hashAppid(a.appid) - hashAppid(b.appid));
}

// Hash simple (xorshift) : deterministe pour un appid donne, sert uniquement a
// repartir les jeux de completion sans favoriser systematiquement l'ordre d'origine.
function hashAppid(appid: number): number {
  let hash = appid;
  hash ^= hash << 13;
  hash ^= hash >>> 17;
  hash ^= hash << 5;
  return hash >>> 0;
}

const MAX_JUSTIFICATION_LENGTH = 400;

const MistralSuggestionSchema = z.object({
  appid: z.number(),
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  matchPercent: z.number().int().min(0).max(100),
  whyThisGame: z.string().min(1).max(MAX_JUSTIFICATION_LENGTH),
  whyThisRank: z.string().min(1).max(MAX_JUSTIFICATION_LENGTH),
});

// On force le modele a repondre avec un objet racine (contrainte de
// `response_format: { type: "json_object" }`, qui n'accepte pas un tableau nu).
const MistralResponseSchema = z.object({
  suggestions: z.array(MistralSuggestionSchema).length(3),
});

type MistralSuggestion = z.infer<typeof MistralSuggestionSchema>;

interface MistralChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function matchWithMistral(
  candidates: Game[],
  criteria: Criteria,
): Promise<Suggestion[]> {
  if (candidates.length === 0) {
    throw new Error("Aucun jeu candidat a soumettre a Mistral.");
  }

  const validAppids = new Set(candidates.map((game) => game.appid));
  const prompt = buildPrompt(candidates, criteria);

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const mistralSuggestions = await requestMistralSuggestions(prompt);
      validateAgainstCandidates(mistralSuggestions, validAppids);
      return buildSuggestions(mistralSuggestions, candidates);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Le matching Mistral a echoue apres ${MAX_ATTEMPTS} tentative(s) : ${describeError(lastError)}`,
  );
}

async function requestMistralSuggestions(prompt: string): Promise<MistralSuggestion[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY n'est pas definie (voir .env.example).");
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui choisit des jeux video a proposer a un joueur pour sa soiree. " +
            "Tu reponds uniquement avec du JSON strict respectant exactement le format demande, sans aucun texte hors JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral API a repondu avec le statut ${response.status}.`);
  }

  const data = (await response.json()) as MistralChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Reponse Mistral sans contenu exploitable.");
  }

  // `response_format: { type: "json_object" }` garantit un contenu JSON valide
  // d'apres la doc Mistral, mais on reste defensif au cas ou un modele
  // enveloppe quand meme sa reponse dans un bloc de code markdown ou y ajoute
  // un preambule : ca ne coute rien et evite un echec inutile.
  const jsonPayload = extractJsonPayload(content);

  let raw: unknown;
  try {
    raw = JSON.parse(jsonPayload);
  } catch {
    throw new Error(
      `Reponse Mistral non-JSON (extrait recu : ${truncateForLog(jsonPayload)}).`,
    );
  }

  const parsed = MistralResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Reponse Mistral de forme inattendue (${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}) — extrait recu : ${truncateForLog(jsonPayload)}.`,
    );
  }

  return parsed.data.suggestions;
}

// Retire un eventuel bloc de code markdown (```json ... ``` ou ``` ... ```)
// et le texte avant/apres, au cas ou le modele n'a pas suivi le mode JSON strict.
function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  // Sinon, isole le plus grand bloc entre la premiere '{' et la derniere '}'
  // (couvre le cas d'un preambule/commentaire hors JSON sans backticks).
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function truncateForLog(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

// Ne fait jamais confiance a l'IA pour ce qui peut se verifier : les appid renvoyes
// doivent appartenir a la liste des candidats soumis, et les 3 rangs doivent etre
// exactement 1, 2 et 3 (une seule fois chacun). Toute violation leve une erreur,
// ce qui declenche la nouvelle tentative geree par `matchWithMistral`.
function validateAgainstCandidates(
  suggestions: MistralSuggestion[],
  validAppids: Set<number>,
): void {
  const appids = suggestions.map((suggestion) => suggestion.appid);
  const uniqueAppids = new Set(appids);
  if (uniqueAppids.size !== suggestions.length) {
    throw new Error("Mistral a renvoye des jeux en double.");
  }
  for (const appid of appids) {
    if (!validAppids.has(appid)) {
      throw new Error(`Mistral a renvoye un appid hors liste (${appid}).`);
    }
  }

  const ranks = new Set(suggestions.map((suggestion) => suggestion.rank));
  if (ranks.size !== 3 || !ranks.has(1) || !ranks.has(2) || !ranks.has(3)) {
    throw new Error("Mistral n'a pas renvoye exactement les rangs 1, 2 et 3.");
  }
}

// Les champs factuels (nom, temps joue, derniere session) sont repris depuis les
// donnees source (`candidates`), jamais depuis la reponse de l'IA, qui pourrait les
// halluciner ou les reformuler.
function buildSuggestions(
  mistralSuggestions: MistralSuggestion[],
  candidates: Game[],
): Suggestion[] {
  const candidatesByAppid = new Map(candidates.map((game) => [game.appid, game]));

  return [...mistralSuggestions]
    .sort((a, b) => a.rank - b.rank)
    .map((suggestion) => {
      const game = candidatesByAppid.get(suggestion.appid);
      if (!game) {
        // Deja verifie par validateAgainstCandidates, garde-fou defensif.
        throw new Error(`Jeu candidat introuvable pour l'appid ${suggestion.appid}.`);
      }
      return {
        rank: suggestion.rank,
        appid: game.appid,
        name: game.name,
        playtimeForeverMinutes: game.playtimeForeverMinutes,
        lastPlayedAt: game.lastPlayedAt,
        posterUrl: null,
        match: {
          percent: suggestion.matchPercent,
          whyThisGame: suggestion.whyThisGame,
          whyThisRank: suggestion.whyThisRank,
        },
      };
    });
}

function buildPrompt(candidates: Game[], criteria: Criteria): string {
  const gamesList = candidates
    .map(
      (game) =>
        `- appid ${game.appid} : "${game.name}", ${formatPlaytime(game.playtimeForeverMinutes)} joues au total, derniere session : ${formatLastPlayed(game.lastPlayedAt)}`,
    )
    .join("\n");

  return `Contexte : le site "Ce soir je joue a ..." aide un joueur a choisir quoi jouer ce soir parmi les jeux Steam qu'il possede deja. Tu dois lui suggerer exactement 3 jeux, classes du plus pertinent (rang 1) au moins pertinent (rang 3), a partir de la liste de jeux candidats ci-dessous et de son etat du moment.

Jeux candidats (bibliotheque Steam du joueur) :
${gamesList}

Etat du joueur ce soir :
- Humeur(s) : ${criteria.moods.join(", ")}
- Niveau de fatigue : ${criteria.fatigue}
- Temps disponible : ${criteria.time} minutes
- Moment de la journee : ${criteria.moment}

Consignes :
- Choisis exactement 3 jeux, uniquement parmi les jeux candidats listes ci-dessus (utilise leur appid exact, ne jamais inventer ou choisir un jeu hors liste).
- Classe-les avec rank 1 (le meilleur choix), rank 2 et rank 3.
- Pour chaque jeu, donne un matchPercent (0 a 100) qui reflete a quel point ce jeu correspond a l'etat du joueur.
- whyThisGame : explique en francais, en 1 a 2 phrases, ton direct, pourquoi ce jeu correspond a son etat de ce soir (humeur, fatigue, temps disponible, moment de la journee). Exemple de ton attendu : "Vous etes fatigue et vous avez une heure. Ce jeu se joue par sessions courtes, parfait pour souffler sans s'engager."
- whyThisRank : explique en francais, en 1 a 2 phrases, pourquoi ce jeu occupe precisement ce rang plutot qu'un autre parmi les 3 proposes.
- Reponds uniquement avec un objet JSON de la forme exacte suivante, sans texte avant ou apres :
{"suggestions": [{"appid": number, "rank": 1 | 2 | 3, "matchPercent": number, "whyThisGame": string, "whyThisRank": string}, ...3 elements au total]}`;
}

function formatPlaytime(minutes: number): string {
  if (minutes <= 0) {
    return "0h (jamais lance)";
  }
  const hours = minutes / 60;
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${minutes} min`;
}

function formatLastPlayed(lastPlayedAt: string | null): string {
  if (!lastPlayedAt) {
    return "jamais joue";
  }
  return new Date(lastPlayedAt).toISOString().slice(0, 10);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
