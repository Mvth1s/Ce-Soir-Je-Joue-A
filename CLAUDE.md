# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Ce soir je joue a ..." suggests 3 games playable right now, picked from the user's Steam library based on mood, fatigue level, available time, and time of day.

## Project status

V1 implemented: Steam login, criteria form, and the podium suggestion flow all work end-to-end. pnpm monorepo: `front/` (Vue 3 + Vite SPA), `back/src/` (backend logic: db, session, Steam/Mistral/SteamGridDB clients), `api/` (thin Vercel serverless entrypoints importing from `back/src/`).

## Commandes

- `pnpm install` : installer les dependances (racine, workspaces `front` et `back`).
- `pnpm dev:full` : lance le front (Vite, port 5173) et l'API locale (port 3000) en parallele ; ouvrir `http://localhost:5173` (Vite proxy les appels `/api`).
- `pnpm dev` : front seul (les appels API echouent sans `dev:api` en face).
- `pnpm dev:api` : API seule, servie directement sur `http://localhost:3000/api/...` par `scripts/dev-server.ts`.
- `pnpm build` : build de production du front (`front/dist`), c'est aussi la commande utilisee par Vercel (`vercel.json`).
- `pnpm typecheck` : `vue-tsc -b` (front) puis `tsc --noEmit` (back, qui couvre aussi `api/**` et `scripts/**`, voir `back/tsconfig.json`).
- Filtrer un seul workspace : `pnpm --filter front <script>` ou `pnpm --filter back <script>` (ex. `pnpm --filter front typecheck`).
- Preparer la base localement : `psql "$DATABASE_URL" -f back/src/db/schema.sql`.
- `pnpm test:e2e` : suite Playwright (voir `tests/README.md`) ; aucun compte Steam ni cle d'API reelle necessaire (tout est mocke), mais `DATABASE_URL` doit pointer vers une vraie base Postgres (Neon) de test.
- `pnpm healthcheck` : verifie que Steam Web API, Steam OpenID, Mistral, SteamGridDB et Neon repondent (voir `scripts/healthcheck.ts`), utilise par `.github/workflows/healthcheck.yml`.
- Aucun linter (ESLint/Prettier) n'est configure dans ce depot a ce jour ; ne pas supposer l'existence d'une commande `lint`.

## Stack

- **Front** : Vue 3
- **Back** : TypeScript, fonctions serverless Vercel natives (pas de framework HTTP)
- **Stockage** : Postgres (Neon) via `@neondatabase/serverless`
- **Hebergement** : Vercel

## Documents de reference

- `docs/01-cahier-des-charges.md` : objectifs, perimetre V1/V2, criteres, cas limites, RGPD
- `docs/02-architecture-logicielle.md` : composants, services externes, sequence d'une requete, donnees stockees
- `docs/03-architecture-site.md` : pages, navigation, comportement du podium, pages d'erreur
- `docs/04-deploiement-et-rollback.md` : pipeline CI/CD, previews Vercel, promotion en production, rollback manuel

Consulter ces documents avant toute decision de conception qui s'ecarte de ce qui y est deja tranche. Si une decision documentee doit changer, mettre a jour le document correspondant dans le meme commit.

## Perimetre V1 (important)

- **Steam uniquement.** Ne pas ajouter de code pour Epic, GOG, Ubisoft ou EA sans qu'une decision explicite l'ait ajoute au cahier des charges.
- **Pas de systeme d'inscription.** Connexion via Steam OpenID uniquement. Ne pas ajouter de formulaire d'inscription email/mot de passe.
- **Resynchronisation automatique** de la bibliotheque a chaque chargement de page, pas de bouton "actualiser" manuel.

## Regle d'architecture non negociable

Toute donnee utilisateur doit passer par un **identifiant utilisateur interne** (`user_id`, genere par le backend), jamais directement par le `SteamID64`. Le SteamID64 est stocke comme une "liaison de plateforme" (`user_id`, `platform`, `platform_id`) rattachee a cet identifiant interne. Cette regle existe pour permettre, plus tard et sans migration, l'ajout d'un vrai systeme de compte et d'autres plateformes.

Ne jamais utiliser le SteamID64 comme cle primaire ou comme identifiant de session.

## Architecture des handlers API

Chaque fichier sous `api/` exporte un handler `(req, res) => Promise<void>` type sur `IncomingMessage`/`ServerResponse` (`node:http`), **pas** sur `VercelRequest`/`VercelResponse` — il n'y a pas de dependance a `@vercel/node` dans ce depot. Consequences a respecter pour tout nouveau handler :

- Ne pas supposer que `req.body` est deja parse : lire et parser le flux soi-meme si absent (voir `readJsonBody` dans `api/suggest.ts`), avec une limite de taille explicite.
- Utiliser `sendJson` et `rejectMethod` de `back/src/http.ts` pour les reponses et la verification de methode HTTP, plutot que reimplementer ce comportement.
- La correspondance route -> fichier est purement basee sur l'arborescence de `api/` (ex. `api/auth/steam.ts` -> `/api/auth/steam`) ; en local, `scripts/dev-server.ts` la decouvre automatiquement au demarrage, aucune table de routes a maintenir a la main.
- Toute logique metier (acces DB, appels Steam/Mistral/SteamGridDB) vit dans `back/src/`, jamais directement dans `api/*.ts` : les fichiers `api/` restent de fines entrees HTTP qui valident, appellent `back/src/`, puis serialisent la reponse.

## Services externes

| Service | Role | Notes |
|---|---|---|
| Steam OpenID | Connexion | via le paquet `openid` (`RelyingParty`, mode stateless) |
| Steam Web API | Bibliotheque, temps joue, derniere session | mise en cache Postgres (TTL 4h) |
| Mistral API | Matching IA | tier gratuit ; recoit titre/temps joue/derniere session (pas le genre, indisponible sans appel Steam supplementaire par jeu) + criteres utilisateur, renvoie nom + ID Steam |
| SteamGridDB | Affiches portrait | requetee avec l'ID Steam renvoye par Mistral |

## Sequence d'une requete de suggestion

1. Verifier l'identifiant utilisateur interne et le SteamID64 associe.
2. Resynchroniser la bibliotheque (cache si valide, sinon appel a la Steam Web API).
3. Si bibliotheque vide, basculer sur une liste de jeux gratuits Steam.
4. Recevoir les criteres utilisateur (humeur, fatigue, temps disponible, moment de la journee).
5. Envoyer a Mistral, pour une shortlist deterministe de jeux candidats (max 40, priorite aux jeux recents/tres joues) : titre, temps joue, derniere session, plus les criteres utilisateur.
6. Recevoir de Mistral 3 jeux (nom + ID Steam).
7. Recuperer l'affiche portrait de chaque jeu via SteamGridDB a partir de l'ID Steam.
8. Renvoyer les 3 jeux et leurs affiches au front.

## Conventions de code

- TypeScript strict active sur le backend.
- Composants Vue 3 en Composition API (`<script setup>`), pas d'Options API.
- Pas de secret ou de cle d'API en dur dans le code : variables d'environnement uniquement.
- Le front ne parle jamais directement a Steam, Mistral ou SteamGridDB : tout passe par le backend.
- Toute nouvelle donnee utilisateur stockee doit etre documentee dans `docs/02-architecture-logicielle.md` (section "Donnees stockees"), en lien avec le point de vigilance RGPD du `docs/01-cahier-des-charges.md`.

## Tests et CI/CD

- Tests end-to-end Playwright dans `tests/e2e/` (voir `tests/README.md` pour le detail). Ils tournent contre une vraie instance du front et de l'API (`scripts/e2e-server.ts`), avec Steam OpenID/Steam Web API/Mistral/SteamGridDB entierement mockes (`tests/e2e/support/`) et une vraie base Postgres de test.
- `scripts/e2e-server.ts` et `scripts/dev-server.ts` partagent leur logique de routage via `scripts/lib/apiServer.ts` ; ne pas dupliquer cette logique si un troisieme variant est necessaire un jour.
- Le mock Steam OpenID (`tests/e2e/support/steamAuthMock.ts`) utilise `nock`, volontairement fige sur la branche majeure 13.x : `nock` 14+ patche aussi `fetch` global (via `@mswjs/interceptors`), ce qui bloquerait a tort les appels reels vers Neon (qui utilise `fetch`). Ne pas monter cette dependance sans revalider ce point.
- Le mock des API HTTP (`tests/e2e/support/externalApiMocks.ts`) utilise `undici.MockAgent` : la version du paquet `undici` explicite en devDependency doit rester alignee sur celle bundlee par la version de Node utilisee (`process.versions.undici`), sinon `setGlobalDispatcher` n'a aucun effet sur le vrai `fetch` global (cle de registre globale differente selon la version majeure).
- `.github/workflows/ci.yml` : jobs `test` -> `build` -> `deploy-production` (ce dernier uniquement sur push vers `main`). Les previews (branches `dev`, PR) restent gerees par l'integration Git native de Vercel, pas par ce workflow.
- Les captures de reference de regression visuelle (`tests/e2e/__screenshots__/`) ne sont generees/comparees qu'en CI, jamais en local (voir `tests/README.md`).

## Langue

Le contenu utilisateur (interface, messages d'erreur, textes) est en francais. Les noms de variables, fonctions et commentaires de code restent en anglais, sauf terme metier sans equivalent clair.

## Sous-agents disponibles

Voir `.claude/agents/` : `frontend-developer`, `backend-developer`, `code-reviewer`, `documentation-writer`, `security-reviewer`.
