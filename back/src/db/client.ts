import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Pilote HTTP (une requete = un appel fetch) plutot qu'une connexion
// persistante : pas de cycle de vie de connexion (.connect()/.end()) a gerer
// entre des invocations de fonctions serverless qui sont ephemeres par
// nature. C'est le pilote recommande par Neon/Vercel pour ce contexte
// (voir https://neon.com/docs/guides/vercel-postgres-transition-guide).
let sqlClient: NeonQueryFunction<false, true> | null = null;

export function getDb(): NeonQueryFunction<false, true> {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL n'est pas definie (voir .env.example).");
    }
    sqlClient = neon(connectionString, { fullResults: true });
  }
  return sqlClient;
}
