import type { IncomingMessage, ServerResponse } from "node:http";

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

export function readPublicBaseUrl(): string {
  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("PUBLIC_BASE_URL doit etre defini (voir .env.example).");
  }
  return baseUrl;
}

// Renvoie true (et repond 405) si la methode ne correspond pas ; le handler
// appelant doit alors `return` immediatement sans continuer son traitement.
export function rejectMethod(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: string,
): boolean {
  if (req.method !== allowed) {
    res.writeHead(405, { Allow: allowed, "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return true;
  }
  return false;
}
