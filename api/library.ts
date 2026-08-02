import type { IncomingMessage, ServerResponse } from "node:http";
import { getSession } from "../back/src/session";
import { getLibrary } from "../back/src/library";
import { rejectMethod, sendJson } from "../back/src/http";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (rejectMethod(req, res, "GET")) {
    return;
  }

  try {
    const session = await getSession(req, res);
    if (!session.userId) {
      sendJson(res, 401, { error: "not_authenticated" });
      return;
    }

    const { games, usingFreeGames } = await getLibrary(session.userId);
    sendJson(res, 200, { count: games.length, usingFreeGames });
  } catch (error) {
    console.error("library_sync_failed", error);
    sendJson(res, 500, { error: "library_sync_failed" });
  }
}
