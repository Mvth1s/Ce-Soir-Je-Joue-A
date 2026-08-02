import type { Game } from "./types";

const GET_OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";

interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played?: number;
}

interface GetOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export async function getOwnedGames(steamId64: string): Promise<Game[]> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    throw new Error("STEAM_API_KEY n'est pas definie (voir .env.example).");
  }

  const url = new URL(GET_OWNED_GAMES_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId64);
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("include_played_free_games", "true");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Steam Web API a repondu avec le statut ${response.status}.`);
  }

  const data = (await response.json()) as GetOwnedGamesResponse;
  const games = data.response.games;
  // Bibliotheque vide ou profil prive : Steam ne renvoie pas de champ `games`.
  if (!games) {
    return [];
  }

  return games.map(mapSteamGame);
}

function mapSteamGame(game: SteamOwnedGame): Game {
  return {
    appid: game.appid,
    name: game.name,
    playtimeForeverMinutes: game.playtime_forever,
    lastPlayedAt: toIsoStringOrNull(game.rtime_last_played),
  };
}

function toIsoStringOrNull(rtimeLastPlayed: number | undefined): string | null {
  if (!rtimeLastPlayed) {
    return null;
  }
  return new Date(rtimeLastPlayed * 1000).toISOString();
}
