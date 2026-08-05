// Simule les 3 services externes appeles via `fetch` par back/src/
// (Steam Web API, Mistral, SteamGridDB), sans toucher a leur code de
// production. `fetch` global de Node (>=18) est base sur undici : on
// remplace le dispatcher global par un `MockAgent`, avec `enableNetConnect()`
// pour laisser passer tout ce qui n'est pas explicitement mocke ici
// (notamment les appels du driver Postgres Neon, qui utilisent aussi `fetch`
// mais doivent atteindre la vraie base de test, voir tests/README.md).
import { MockAgent, setGlobalDispatcher } from "undici";
import { EMPTY_LIBRARY_SUFFIX, FIXTURE_GAMES } from "../fixtures/library";

let installed = false;

export function installExternalApiMocks(): void {
  if (installed) return;
  installed = true;

  const mockAgent = new MockAgent();
  mockAgent.enableNetConnect();
  setGlobalDispatcher(mockAgent);

  mockAgent
    .get("https://api.steampowered.com")
    .intercept({
      path: (path) => path.startsWith("/IPlayerService/GetOwnedGames"),
      method: "GET",
    })
    .reply(
      200,
      (opts) => {
        const steamid = new URL(`https://api.steampowered.com${opts.path}`).searchParams.get(
          "steamid",
        );
        if (steamid?.endsWith(EMPTY_LIBRARY_SUFFIX)) {
          // Comme un vrai profil sans jeux/prive : la Steam Web API ne
          // renvoie pas de champ `games` du tout (voir back/src/steamWebApi.ts).
          return { response: {} };
        }
        return { response: { game_count: FIXTURE_GAMES.length, games: FIXTURE_GAMES } };
      },
    )
    .persist();

  mockAgent
    .get("https://api.mistral.ai")
    .intercept({ path: "/v1/chat/completions", method: "POST" })
    .reply(200, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestions: [
                {
                  appid: FIXTURE_GAMES[0]!.appid,
                  rank: 1,
                  matchPercent: 92,
                  whyThisGame: "Un jeu que vous avez beaucoup joue recemment, ideal ce soir.",
                  whyThisRank: "C'est votre jeu le plus joue de la selection.",
                },
                {
                  appid: FIXTURE_GAMES[1]!.appid,
                  rank: 2,
                  matchPercent: 81,
                  whyThisGame: "Un classique de votre bibliotheque, toujours efficace.",
                  whyThisRank: "Un bon compromis derriere le premier choix.",
                },
                {
                  appid: FIXTURE_GAMES[2]!.appid,
                  rank: 3,
                  matchPercent: 74,
                  whyThisGame: "Une experience plus longue si l'envie vous prend.",
                  whyThisRank: "Complete bien le podium de ce soir.",
                },
              ],
            }),
          },
        },
      ],
    })
    .persist();

  mockAgent
    .get("https://www.steamgriddb.com")
    .intercept({
      path: (path) => path.startsWith("/api/v2/grids/steam/"),
      method: "GET",
    })
    .reply(200, (opts) => {
      const appid = opts.path.split("/").pop()?.split("?")[0];
      return {
        success: true,
        data: [{ url: `http://localhost:3000/e2e-assets/poster.png?appid=${appid}` }],
      };
    })
    .persist();
}
