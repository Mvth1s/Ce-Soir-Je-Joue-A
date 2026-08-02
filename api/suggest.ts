import type { IncomingMessage, ServerResponse } from "node:http";
import { getSession } from "../back/src/session";
import { CriteriaSchema } from "../back/src/criteria";
import { getSuggestions } from "../back/src/suggestFlow";
import { rejectMethod, sendJson } from "../back/src/http";

// Le corps attendu (criteres) fait quelques centaines d'octets ; on plafonne large
// pour absorber un payload malveillant avant meme la validation zod.
const MAX_BODY_BYTES = 10_000;

class PayloadTooLargeError extends Error {}

// Premiere route POST du projet : rien ne garantit qu'un body-parsing automatique
// soit actif pour ce style de handler generique (pas de dependance a @vercel/node
// ici, cf. conventions des lots precedents). On reutilise `req.body` s'il a deja
// ete rempli par la plateforme d'hebergement, sinon on lit le flux nous-memes.
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const maybeBody = (req as IncomingMessage & { body?: unknown }).body;
  if (maybeBody !== undefined) {
    return typeof maybeBody === "string" ? JSON.parse(maybeBody) : maybeBody;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    totalBytes += buf.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (rejectMethod(req, res, "POST")) {
    return;
  }

  try {
    const session = await getSession(req, res);
    if (!session.userId) {
      sendJson(res, 401, { error: "not_authenticated" });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        sendJson(res, 413, { error: "payload_too_large" });
        return;
      }
      sendJson(res, 400, { error: "invalid_criteria" });
      return;
    }

    const parsedCriteria = CriteriaSchema.safeParse(body);
    if (!parsedCriteria.success) {
      sendJson(res, 400, { error: "invalid_criteria" });
      return;
    }

    const suggestions = await getSuggestions(session.userId, parsedCriteria.data);
    sendJson(res, 200, { suggestions });
  } catch (error) {
    console.error("suggestion_failed", error);
    sendJson(res, 500, { error: "suggestion_failed" });
  }
}
