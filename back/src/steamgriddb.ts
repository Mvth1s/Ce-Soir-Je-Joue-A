// Affiches portrait via SteamGridDB. Voir docs/02-architecture-logicielle.md
// (section "SteamGridDB").
import type { Suggestion } from "./types";

const STEAMGRIDDB_GRIDS_URL = "https://www.steamgriddb.com/api/v2/grids/steam";

interface SteamGridDbGridsResponse {
  success: boolean;
  data?: Array<{ url: string }>;
}

// L'affiche est purement cosmetique : jamais bloquante. Toute erreur (cle absente,
// reseau, quota, jeu sans affiche disponible) se traduit par `null`, sans exception
// ni log bruyant.
export async function fetchPosterUrl(appid: number): Promise<string | null> {
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    // `types=static` exclut les affiches animees (webm/apng), potentiellement
    // plusieurs Mo contre quelques centaines de Ko pour une image statique —
    // le podium n'affiche que 3 affiches, mais chacune doit rester legere.
    const response = await fetch(
      `${STEAMGRIDDB_GRIDS_URL}/${appid}?dimensions=600x900&types=static&limit=1`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SteamGridDbGridsResponse;
    if (!data.success) {
      return null;
    }
    return data.data?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

export async function attachPosters(suggestions: Suggestion[]): Promise<Suggestion[]> {
  return Promise.all(
    suggestions.map(async (suggestion) => ({
      ...suggestion,
      posterUrl: await fetchPosterUrl(suggestion.appid),
    })),
  );
}
