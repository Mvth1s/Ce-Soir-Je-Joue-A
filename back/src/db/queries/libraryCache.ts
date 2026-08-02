import { getDb } from "../client";
import type { Game } from "../../types";

export async function getCachedLibrary(userId: string, ttlMs: number): Promise<Game[] | null> {
  const sql = getDb();
  const result = await sql`
    select games, fetched_at from library_cache where user_id = ${userId}
  `;
  const row = result.rows[0] as { games: Game[]; fetched_at: string } | undefined;
  if (!row) {
    return null;
  }
  const fetchedAt = new Date(row.fetched_at).getTime();
  if (Date.now() - fetchedAt > ttlMs) {
    return null;
  }
  return row.games;
}

export async function setCachedLibrary(userId: string, games: Game[]): Promise<void> {
  const sql = getDb();
  await sql`
    insert into library_cache (user_id, games, fetched_at)
    values (${userId}, ${JSON.stringify(games)}::jsonb, now())
    on conflict (user_id) do update
      set games = excluded.games, fetched_at = excluded.fetched_at
  `;
}
