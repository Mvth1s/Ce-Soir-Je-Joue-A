import type { IncomingMessage, ServerResponse } from "node:http";
import { verifySteamAssertion } from "../../back/src/steamAuth";
import { getSession } from "../../back/src/session";
import { createUser } from "../../back/src/db/queries/users";
import { findUserIdByPlatformId, linkPlatform } from "../../back/src/db/queries/platformLinks";
import { readPublicBaseUrl } from "../../back/src/http";

function parseQuery(req: IncomingMessage): Record<string, unknown> {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
  return Object.fromEntries(url.searchParams.entries());
}

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
    const query = parseQuery(req);
    const steamId64 = await verifySteamAssertion(returnUrl, query);

    if (!steamId64) {
      res.writeHead(302, { Location: "/?auth_error=1" });
      res.end();
      return;
    }

    let userId = await findUserIdByPlatformId("steam", steamId64);
    if (!userId) {
      userId = await createUser();
      await linkPlatform(userId, "steam", steamId64);
    }

    const session = await getSession(req, res);
    session.userId = userId;
    await session.save();

    res.writeHead(302, { Location: "/criteres" });
    res.end();
  } catch (error) {
    console.error("steam_auth_callback_failed", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Erreur lors de la finalisation de la connexion Steam.");
  }
}
