import { getDb } from "../client";

export async function findUserIdByPlatformId(
  platform: string,
  platformId: string,
): Promise<string | null> {
  const db = await getDb();
  const result = await db.sql<{ user_id: string }>`
    select user_id from platform_links
    where platform = ${platform} and platform_id = ${platformId}
  `;
  return result.rows[0]?.user_id ?? null;
}

export async function findPlatformIdByUserId(
  userId: string,
  platform: string,
): Promise<string | null> {
  const db = await getDb();
  const result = await db.sql<{ platform_id: string }>`
    select platform_id from platform_links
    where user_id = ${userId} and platform = ${platform}
  `;
  return result.rows[0]?.platform_id ?? null;
}

export async function linkPlatform(
  userId: string,
  platform: string,
  platformId: string,
): Promise<void> {
  const db = await getDb();
  await db.sql`
    insert into platform_links (user_id, platform, platform_id)
    values (${userId}, ${platform}, ${platformId})
    on conflict (platform, platform_id) do nothing
  `;
}
