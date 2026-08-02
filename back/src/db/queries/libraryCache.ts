import { getDb } from "../client";
import type { Game } from "../../types";

export async function getCachedLibrary(userId: string, ttlMs: number): Promise<Game[] | null> {
  const db = await getDb();
  const result = await db.sql<{ games: Game[]; fetched_at: string }>`
    select games, fetched_at from library_cache where user_id = ${userId}
  `;
  const row = result.rows[0];
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
  const db = await getDb();
  await db.sql`
    insert into library_cache (user_id, games, fetched_at)
    values (${userId}, ${JSON.stringify(games)}::jsonb, now())
    on conflict (user_id) do update
      set games = excluded.games, fetched_at = excluded.fetched_at
  `;
}
