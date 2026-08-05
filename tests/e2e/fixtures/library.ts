// Bibliotheque Steam factice utilisee par tests/e2e/support/externalApiMocks.ts
// pour simuler la reponse de la Steam Web API (IPlayerService/GetOwnedGames).
// Volontairement < 40 jeux : selectCandidates() (back/src/mistral.ts) renvoie
// alors la liste telle quelle, dans cet ordre, ce qui rend la reponse Mistral
// mockee (voir externalApiMocks.ts) previsible sans avoir a reimplementer la
// logique de selection dans le mock.
export interface FixtureGame {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played?: number;
}

export const FIXTURE_GAMES: FixtureGame[] = [
  {
    appid: 570,
    name: "Dota 2",
    playtime_forever: 12_400,
    rtime_last_played: Math.floor(Date.now() / 1000) - 60 * 60 * 6,
  },
  {
    appid: 730,
    name: "Counter-Strike 2",
    playtime_forever: 8_100,
    rtime_last_played: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 2,
  },
  {
    appid: 1091500,
    name: "Cyberpunk 2077",
    playtime_forever: 3_200,
    rtime_last_played: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
  },
  {
    appid: 1245620,
    name: "Elden Ring",
    playtime_forever: 5_400,
    rtime_last_played: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 10,
  },
  {
    appid: 413150,
    name: "Stardew Valley",
    playtime_forever: 900,
    rtime_last_played: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 90,
  },
  {
    appid: 620,
    name: "Portal 2",
    playtime_forever: 0,
  },
];

// Les 3 premiers jeux de la liste ci-dessus, dans l'ordre exact renvoye par
// le mock Mistral (externalApiMocks.ts) : rank 1 = Dota 2, rank 2 = CS2,
// rank 3 = Cyberpunk 2077. Les specs s'appuient sur ces noms plutot que de
// re-deriver l'ordre a partir de FIXTURE_GAMES.
export const EXPECTED_PODIUM = {
  gold: "Dota 2",
  silver: "Counter-Strike 2",
  bronze: "Cyberpunk 2077",
};

// Suffixe reconnu par externalApiMocks.ts pour declencher le cas
// "bibliotheque vide" (Steam Web API mockee renvoyant une reponse sans champ
// `games`). Chaque test genere son propre SteamID64 (voir defaultSteamId /
// emptyLibrarySteamId ci-dessous) plutot que de reutiliser une constante
// partagee : les tests tournent en parallele (fullyParallel, voir
// playwright.config.ts), et un meme SteamID64 utilise par deux logins
// concurrents peut faire perdre la course sur l'insertion de platform_links
// (contrainte `on conflict (platform, platform_id) do nothing`) a l'un des
// deux, qui se retrouve alors avec une session sans liaison Steam.
export const EMPTY_LIBRARY_SUFFIX = "999999";

function randomDigits(length: number): string {
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

export function defaultSteamId(): string {
  return `1${Date.now()}${randomDigits(6)}`;
}

export function emptyLibrarySteamId(): string {
  return `1${Date.now()}${randomDigits(6)}${EMPTY_LIBRARY_SUFFIX}`;
}
