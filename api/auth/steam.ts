import type { IncomingMessage, ServerResponse } from "node:http";
import { getSteamAuthUrl } from "../../back/src/steamAuth";
import { readPublicBaseUrl } from "../../back/src/http";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end();
    return;
  }

  try {
    const returnUrl = new URL("/api/auth/callback", readPublicBaseUrl()).toString();
    const authUrl = await getSteamAuthUrl(returnUrl);
    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (error) {
    console.error("steam_auth_init_failed", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Erreur lors de l'initialisation de la connexion Steam.");
  }
}
