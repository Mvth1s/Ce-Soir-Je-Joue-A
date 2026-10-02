// Simule les 3 services externes appeles via `fetch` par back/src/
// (Steam Web API, Mistral, SteamGridDB), sans toucher a leur code de
// production. `nock` 14+ intercepte aussi le `fetch` global de Node (via
// @mswjs/interceptors), en plus des modules `http`/`https` : les memes
// regles que pour Steam OpenID s'appliquent donc ici, y compris le blocage
// de tout hote externe non mocke (voir installSteamAuthMock dans
// steamAuthMock.ts, qui autorise seulement localhost et la base Neon de test).
import nock from "nock";
import { EMPTY_LIBRARY_SUFFIX, FIXTURE_GAMES } from "../fixtures/library";

let installed = false;

export function installExternalApiMocks(): void {
  if (installed) return;
  installed = true;

  nock("https://api.steampowered.com")
    .persist()
    .get((uri) => uri.startsWith("/IPlayerService/GetOwnedGames"))
    .reply(200, (uri) => {
      const steamid = new URL(`https://api.steampowered.com${uri}`).searchParams.get("steamid");
      if (steamid?.endsWith(EMPTY_LIBRARY_SUFFIX)) {
        // Comme un vrai profil sans jeux/prive : la Steam Web API ne
        // renvoie pas de champ `games` du tout (voir back/src/steamWebApi.ts).
        return { response: {} };
      }
      return { response: { game_count: FIXTURE_GAMES.length, games: FIXTURE_GAMES } };
    });

  nock("https://api.mistral.ai")
    .persist()
    .post("/v1/chat/completions")
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
    });

  nock("https://www.steamgriddb.com")
    .persist()
    .get((uri) => uri.startsWith("/api/v2/grids/steam/"))
    .reply(200, (uri) => {
      const appid = uri.split("/").pop()?.split("?")[0];
      return {
        success: true,
        data: [{ url: `http://localhost:3000/e2e-assets/poster.png?appid=${appid}` }],
      };
    });
}
