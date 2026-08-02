import { getDb } from "../client";

export async function findUserIdByPlatformId(
  platform: string,
  platformId: string,
): Promise<string | null> {
  const sql = getDb();
  const result = await sql`
    select user_id from platform_links
    where platform = ${platform} and platform_id = ${platformId}
  `;
  const row = result.rows[0] as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

export async function findPlatformIdByUserId(
  userId: string,
  platform: string,
): Promise<string | null> {
  const sql = getDb();
  const result = await sql`
    select platform_id from platform_links
    where user_id = ${userId} and platform = ${platform}
  `;
  const row = result.rows[0] as { platform_id: string } | undefined;
  return row?.platform_id ?? null;
}

export async function linkPlatform(
  userId: string,
  platform: string,
  platformId: string,
): Promise<void> {
  const sql = getDb();
  await sql`
    insert into platform_links (user_id, platform, platform_id)
    values (${userId}, ${platform}, ${platformId})
    on conflict (platform, platform_id) do nothing
  `;
}
