import type { IncomingMessage, ServerResponse } from "node:http";
import { getSession } from "../../back/src/session";

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
    const session = await getSession(req, res);
    session.destroy();
  } catch (error) {
    console.error("logout_failed", error);
  }

  res.writeHead(302, { Location: "/" });
  res.end();
}
