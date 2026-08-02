import type { IncomingMessage, ServerResponse } from "node:http";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { SessionData } from "./types";

const MIN_SESSION_SECRET_LENGTH = 32;

function readSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET doit etre defini et contenir au moins ${MIN_SESSION_SECRET_LENGTH} caracteres (voir .env.example).`,
    );
  }
  return secret;
}

const sessionOptions: SessionOptions = {
  cookieName: "csjj_session",
  password: readSessionSecret(),
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

// req/res sont types de facon generique (compatibles avec VercelRequest/VercelResponse,
// qui etendent IncomingMessage/ServerResponse) pour eviter une dependance sur @vercel/node
// dans ce lot, qui ne cree pas encore de handlers dans api/.
export function getSession(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}
