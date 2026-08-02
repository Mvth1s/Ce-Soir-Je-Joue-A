import { createClient, type VercelClient } from "@vercel/postgres";

// On utilise explicitement DATABASE_URL (et non POSTGRES_URL lu par defaut par
// le client `sql`/`db` de @vercel/postgres) pour matcher .env.example.
function createDbClient(): VercelClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL n'est pas definie (voir .env.example).");
  }
  return createClient({ connectionString });
}

let client: VercelClient | null = null;
let connecting: Promise<VercelClient> | null = null;

// Connexion paresseuse et reutilisee (utile en environnement serverless "warm"
// ou le module reste charge entre deux invocations).
export function getDb(): Promise<VercelClient> {
  if (client) {
    return Promise.resolve(client);
  }
  if (!connecting) {
    const newClient = createDbClient();
    connecting = newClient.connect().then(() => {
      client = newClient;
      return newClient;
    });
  }
  return connecting;
}
