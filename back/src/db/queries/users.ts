import { getDb } from "../client";

export async function createUser(): Promise<string> {
  const sql = getDb();
  const result = await sql`
    insert into users default values
    returning id
  `;
  const row = result.rows[0] as { id: string } | undefined;
  if (!row) {
    throw new Error("La creation de l'utilisateur n'a retourne aucun id.");
  }
  return row.id;
}
