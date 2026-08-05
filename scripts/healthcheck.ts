// Verifie independamment la disponibilite des services externes dont
// depend le site (voir docs/02-architecture-logicielle.md, "Services
// externes"), sans passer par le reste de l'application. Pense pour tourner
// en CI sur une planification reguliere (.github/workflows/healthcheck.yml)
// et etre lance manuellement : `tsx scripts/healthcheck.ts`.
//
// Chaque verification est independante (une panne n'empeche jamais les
// autres de s'executer) et bornee par un timeout court.
import { getDb } from "../back/src/db/client";

const TIMEOUT_MS = 5_000;

// Profil Steam public utilise dans la documentation officielle de la Steam
// Web API (Robin Walker, employe Valve) : stable, toujours public, sert
// uniquement a verifier que la cle STEAM_API_KEY est encore valide.
const STEAM_TEST_PROFILE_ID = "76561197960435530";
// Team Fortress 2 : jeu gratuit deja utilise comme repli dans back/src/freeGames.ts,
// choisi ici uniquement parce qu'il a presque certainement une affiche sur SteamGridDB.
const STEAMGRIDDB_TEST_APPID = 440;

type CheckStatus = "ok" | "error" | "timeout";

interface CheckResult {
  name: string;
  status: CheckStatus;
  responseTimeMs: number;
  detail?: string;
}

class HealthCheckTimeoutError extends Error {}

async function runCheck(name: string, fn: (signal: AbortSignal) => Promise<string | void>): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();
  try {
    // `fn` peut ignorer le signal (ex. le driver Neon, qui ne l'expose pas) :
    // le `Promise.race` garantit quand meme un delai maximum pour toute
    // verification, pas seulement celles basees sur `fetch`.
    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new HealthCheckTimeoutError()));
    });
    const detail = await Promise.race([fn(controller.signal), timeoutPromise]);
    return { name, status: "ok", responseTimeMs: performance.now() - start, detail: detail || undefined };
  } catch (error) {
    const responseTimeMs = performance.now() - start;
    const isAbort = error instanceof HealthCheckTimeoutError || (error instanceof Error && error.name === "AbortError");
    return {
      name,
      status: isAbort ? "timeout" : "error",
      responseTimeMs,
      detail: isAbort ? `depasse ${TIMEOUT_MS}ms` : describeError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} n'est pas definie`);
  }
  return value;
}

async function checkSteamWebApi(signal: AbortSignal): Promise<string> {
  const apiKey = requireEnv("STEAM_API_KEY");
  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", STEAM_TEST_PROFILE_ID);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`statut HTTP ${response.status}`);
  }
  const data = (await response.json()) as { response?: { players?: unknown[] } };
  if (!data.response?.players?.length) {
    throw new Error("reponse sans profil joueur");
  }
  return "cle valide, profil de test recupere";
}

async function checkSteamOpenId(signal: AbortSignal): Promise<string> {
  const response = await fetch("https://steamcommunity.com/openid", { signal, redirect: "manual" });
  // Steam repond 200 (page HTML) ou une redirection : les deux prouvent que
  // l'endpoint est joignable. Seule une erreur reseau ou un statut serveur
  // (5xx) doit faire echouer cette verification.
  if (response.status >= 500) {
    throw new Error(`statut HTTP ${response.status}`);
  }
  return `endpoint joignable (statut ${response.status})`;
}

async function checkMistral(signal: AbortSignal): Promise<string> {
  const apiKey = requireEnv("MISTRAL_API_KEY");
  const response = await fetch("https://api.mistral.ai/v1/models", {
    signal,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`statut HTTP ${response.status}`);
  }
  const data = (await response.json()) as { data?: unknown[] };
  if (!data.data?.length) {
    throw new Error("reponse sans modele liste");
  }
  return "cle valide, tier gratuit accessible";
}

async function checkSteamGridDb(signal: AbortSignal): Promise<string> {
  const apiKey = requireEnv("STEAMGRIDDB_API_KEY");
  const response = await fetch(
    `https://www.steamgriddb.com/api/v2/grids/steam/${STEAMGRIDDB_TEST_APPID}?limit=1`,
    { signal, headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!response.ok) {
    throw new Error(`statut HTTP ${response.status}`);
  }
  const data = (await response.json()) as { success?: boolean };
  if (!data.success) {
    throw new Error("reponse en echec (success: false)");
  }
  return "cle valide";
}

async function checkNeonDatabase(): Promise<string> {
  requireEnv("DATABASE_URL");
  const sql = getDb();
  const result = await sql`select 1 as ok`;
  if (result.rows[0]?.ok !== 1) {
    throw new Error("reponse inattendue a SELECT 1");
  }
  return "base joignable";
}

function formatResult(result: CheckResult): string {
  const icon = result.status === "ok" ? "OK   " : result.status === "timeout" ? "TIMEOUT" : "ERREUR";
  const time = `${result.responseTimeMs.toFixed(0)}ms`.padStart(7);
  const detail = result.detail ? ` — ${result.detail}` : "";
  return `[${icon}] ${result.name.padEnd(16)} ${time}${detail}`;
}

async function main(): Promise<void> {
  const results = await Promise.all([
    runCheck("Steam Web API", checkSteamWebApi),
    runCheck("Steam OpenID", checkSteamOpenId),
    runCheck("Mistral API", checkMistral),
    runCheck("SteamGridDB", checkSteamGridDb),
    runCheck("Neon (Postgres)", checkNeonDatabase),
  ]);

  console.log("Health-check des services externes\n");
  for (const result of results) {
    console.log(formatResult(result));
  }

  const failed = results.filter((r) => r.status !== "ok");
  console.log(
    failed.length === 0
      ? "\nTous les services repondent."
      : `\n${failed.length} service(s) en panne ou hors delai : ${failed.map((r) => r.name).join(", ")}.`,
  );

  process.exit(failed.length === 0 ? 0 : 1);
}

main();
