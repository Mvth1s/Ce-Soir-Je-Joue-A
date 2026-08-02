import { getOwnedGames } from "./steamWebApi";
import { getCachedLibrary, setCachedLibrary } from "./db/queries/libraryCache";
import { findPlatformIdByUserId } from "./db/queries/platformLinks";
import { pickFreeGames } from "./freeGames";
import type { Game } from "./types";

// Duree du cache bibliotheque Steam. Point encore ouvert dans docs/01-cahier-des-charges.md ;
// 4h retenu comme valeur de depart raisonnable, a ajuster si besoin.
export const LIBRARY_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export interface LibraryResult {
  games: Game[];
  usingFreeGames: boolean;
}

// Cas limite bibliotheque vide (docs/01) : bascule sur une selection de jeux
// gratuits Steam, traites comme des Game a temps de jeu nul pour le reste du pipeline.
export async function getLibrary(userId: string): Promise<LibraryResult> {
  const cached = await getCachedLibrary(userId, LIBRARY_CACHE_TTL_MS);
  const games = cached ?? (await fetchAndCacheLibrary(userId));

  if (games.length > 0) {
    return { games, usingFreeGames: false };
  }
  return { games: freeGamesAsLibrary(), usingFreeGames: true };
}

async function fetchAndCacheLibrary(userId: string): Promise<Game[]> {
  const steamId64 = await findPlatformIdByUserId(userId, "steam");
  if (!steamId64) {
    throw new Error("Aucun SteamID64 lie a cet utilisateur.");
  }
  const games = await getOwnedGames(steamId64);
  await setCachedLibrary(userId, games);
  return games;
}

function freeGamesAsLibrary(): Game[] {
  return pickFreeGames(3).map((game) => ({
    appid: game.appid,
    name: game.name,
    playtimeForeverMinutes: 0,
    lastPlayedAt: null,
  }));
}
