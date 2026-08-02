// Liste de secours utilisee quand la bibliotheque Steam de l'utilisateur est vide
// (voir docs/01-cahier-des-charges.md, cas limite "bibliotheque vide").
export interface FreeGame {
  appid: number;
  name: string;
}

export const FREE_GAMES: FreeGame[] = [
  { appid: 440, name: "Team Fortress 2" },
  { appid: 570, name: "Dota 2" },
  { appid: 730, name: "Counter-Strike 2" },
  { appid: 230410, name: "Warframe" },
  { appid: 238960, name: "Path of Exile" },
  { appid: 1172470, name: "Apex Legends" },
  { appid: 1085660, name: "Destiny 2" },
  { appid: 578080, name: "PUBG: BATTLEGROUNDS" },
];

export function pickFreeGames(count = 3): FreeGame[] {
  const shuffled = [...FREE_GAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
