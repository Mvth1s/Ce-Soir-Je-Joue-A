// Orchestration complete de la sequence de suggestion decrite dans
// docs/02-architecture-logicielle.md (section "Sequence d'une requete de suggestion").
import { getLibrary } from "./library";
import { selectCandidates, matchWithMistral } from "./mistral";
import { attachPosters } from "./steamgriddb";
import type { Criteria } from "./criteria";
import type { Suggestion } from "./types";

export async function getSuggestions(userId: string, criteria: Criteria): Promise<Suggestion[]> {
  const { games, usingFreeGames } = await getLibrary(userId);

  if (usingFreeGames) {
    // Cas limite bibliotheque vide (docs/01-cahier-des-charges.md) : pas de
    // matching IA, on propose directement les jeux gratuits deja selectionnes par
    // `getLibrary`, avec de vraies affiches SteamGridDB pour rester coherent
    // visuellement avec le podium habituel.
    const freeSuggestions: Suggestion[] = games.slice(0, 3).map((game, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      appid: game.appid,
      name: game.name,
      playtimeForeverMinutes: game.playtimeForeverMinutes,
      lastPlayedAt: game.lastPlayedAt,
      posterUrl: null,
      match: null,
    }));
    return attachPosters(freeSuggestions);
  }

  const candidates = selectCandidates(games);
  const suggestions = await matchWithMistral(candidates, criteria);
  return attachPosters(suggestions);
}
