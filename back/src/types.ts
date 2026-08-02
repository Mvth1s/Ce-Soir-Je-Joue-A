// Types partages entre les modules backend (db, session, services externes)
// et les futurs handlers `api/*.ts`.

export interface Game {
  appid: number;
  name: string;
  playtimeForeverMinutes: number;
  lastPlayedAt: string | null;
}

export interface PlatformLink {
  userId: string;
  platform: string;
  platformId: string;
}

export interface SessionData {
  // Optionnel : iron-session renvoie un objet vide (userId === undefined) tant
  // que personne ne s'est connecte. Toujours verifier avant utilisation.
  userId?: string;
}

// Suggestion pour une carte du podium. `match` est absent quand la bibliotheque
// est vide et qu'on retombe sur des jeux gratuits Steam (pas de matching IA,
// voir docs/01-cahier-des-charges.md, cas limite "bibliotheque vide").
export interface Suggestion {
  rank: 1 | 2 | 3;
  appid: number;
  name: string;
  playtimeForeverMinutes: number;
  lastPlayedAt: string | null;
  posterUrl: string | null;
  match: {
    percent: number;
    whyThisGame: string;
    whyThisRank: string;
  } | null;
}
