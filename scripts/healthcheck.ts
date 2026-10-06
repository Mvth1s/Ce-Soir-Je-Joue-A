// Verifie independamment la disponibilite des services externes dont
// depend le site (voir docs/02-architecture-logicielle.md, "Services
// externes"), sans passer par le reste de l'application. Pense pour tourner
// en CI sur une planification reguliere (.github/workflows/healthcheck.yml)
// et etre lance manuellement : `tsx scripts/healthcheck.ts`.
//
// Chaque verification est independante (une panne n'empeche jamais les
// autres de s'executer) et bornee par un timeout. Seule la base Neon a un
// timeout plus long et quelques nouvelles tentatives : son reveil a froid
// (scale-to-zero) peut depasser le delai des API HTTP sans etre une panne.
import { getDb, NeonDbError } from "../back/src/db/client";

const DEFAULT_TIMEOUT_MS = 5_000;
// Timeout de chaque tentative vers Neon, en millisecondes.
const DATABASE_TIMEOUT_MS = readPositiveIntEnv("DATABASE_TIMEOUT_MS", 15_000);
// Nombre de nouvelles tentatives apres la premiere (0 = une seule tentative).
// Pire cas avec les valeurs par defaut : 3 tentatives x 15s + 1s + 2s
// d'attente = 48s, acceptable pour un job planifie.
const DATABASE_RETRIES = readPositiveIntEnv("DATABASE_RETRIES", 2);
const RETRY_BASE_DELAY_MS = 1_000;

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

interface CheckOptions {
  timeoutMs?: number;
  // Nouvelles tentatives apres la premiere (0 = une seule tentative).
  retries?: number;
  // Seules les erreurs pour lesquelles ce predicat renvoie vrai sont
  // retentees ; un timeout l'est toujours.
  isTransient?: (error: unknown) => boolean;
}

class HealthCheckTimeoutError extends Error {}

function isTimeout(error: unknown): boolean {
  return error instanceof HealthCheckTimeoutError || (error instanceof Error && error.name === "AbortError");
}

// Une tentative, bornee par `timeoutMs`. Le signal est transmis a `fn`, mais
// le `Promise.race` garantit quand meme le delai maximum si `fn` ne
// l'ecoute pas.
async function runAttempt<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new HealthCheckTimeoutError()));
    });
    return await Promise.race([fn(controller.signal), timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

async function runCheck(
  name: string,
  fn: (signal: AbortSignal) => Promise<string | void>,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, isTransient = () => false }: CheckOptions = {},
): Promise<CheckResult> {
  const start = performance.now();
  const maxAttempts = retries + 1;
  // Le resume des tentatives n'est affiche que pour les checks avec retry,
  // pour garder la sortie des autres inchangee.
  const summary = (attempts: number) =>
    retries > 0 ? ` (${attempts} tentative(s), ${((performance.now() - start) / 1000).toFixed(1)}s au total)` : "";

  for (let attempt = 1; ; attempt++) {
    try {
      const detail = await runAttempt(fn, timeoutMs);
      return { name, status: "ok", responseTimeMs: performance.now() - start, detail: `${detail || ""}${summary(attempt)}` || undefined };
    } catch (error) {
      const timedOut = isTimeout(error);
      if (attempt < maxAttempts && (timedOut || isTransient(error))) {
        // Backoff exponentiel court : 1s, 2s, 4s...
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
        continue;
      }
      return {
        name,
        status: timedOut ? "timeout" : "error",
        responseTimeMs: performance.now() - start,
        detail: `${timedOut ? `depasse ${timeoutMs}ms` : describeError(error)}${summary(attempt)}`,
      };
    }
  }
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Le driver Neon recopie la chaine de connexion complete (mot de passe
  // compris) dans son message d'erreur quand elle n'est pas une URL valide.
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? message.replaceAll(connectionString, "<DATABASE_URL>") : message;
}

function readPositiveIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} doit etre un entier >= 0 (recu : "${raw}")`);
  }
  return value;
}

// Erreurs Neon qui meritent une nouvelle tentative : panne reseau (fetch
// rejete), HTTP 429/5xx, ou code SQLSTATE de connexion indisponible (classe
// 08, 53300 trop de connexions, 57P01/57P03 serveur en arret/demarrage).
// Tout le reste (DATABASE_URL absente ou invalide, authentification refusee
// 28xxx, base inexistante 3D000...) echoue immediatement.
function isTransientDatabaseError(error: unknown): boolean {
  if (!(error instanceof NeonDbError)) {
    return false;
  }
  if (error.sourceError) {
    return true;
  }
  const httpStatus = /HTTP status (\d{3})/.exec(error.message)?.[1];
  if (httpStatus) {
    const status = Number(httpStatus);
    return status === 429 || status >= 500;
  }
  const code = error.code ?? "";
  return code.startsWith("08") || ["53300", "57P01", "57P03"].includes(code);
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

async function checkNeonDatabase(signal: AbortSignal): Promise<string> {
  requireEnv("DATABASE_URL");
  const sql = getDb();
  // `fetchOptions` est fusionne dans l'appel fetch du driver HTTP : le signal
  // annule donc vraiment la requete en cours au timeout (le tagged template
  // n'accepte pas d'options, d'ou `sql.query`).
  const result = await sql.query("select 1 as ok", [], { fetchOptions: { signal } });
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
    runCheck("Neon (Postgres)", checkNeonDatabase, {
      timeoutMs: DATABASE_TIMEOUT_MS,
      retries: DATABASE_RETRIES,
      isTransient: isTransientDatabaseError,
    }),
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
