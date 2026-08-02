import { getDb } from "../client";

export async function createUser(): Promise<string> {
  const db = await getDb();
  const result = await db.sql<{ id: string }>`
    insert into users default values
    returning id
  `;
  const row = result.rows[0];
  if (!row) {
    throw new Error("La creation de l'utilisateur n'a retourne aucun id.");
  }
  return row.id;
}
