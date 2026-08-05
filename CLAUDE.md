# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Ce soir je joue a ..." suggests 3 games playable right now, picked from the user's Steam library based on mood, fatigue level, available time, and time of day.

## Project status

V1 implemented: Steam login, criteria form, and the podium suggestion flow all work end-to-end. pnpm monorepo: `front/` (Vue 3 + Vite SPA), `back/src/` (backend logic: db, session, Steam/Mistral/SteamGridDB clients), `api/` (thin Vercel serverless entrypoints importing from `back/src/`). Common commands: `pnpm install`, `pnpm dev` (front only — pair with `vercel dev` for the `api/` functions), `pnpm build`, `pnpm typecheck`.

## Stack

- **Front** : Vue 3
- **Back** : TypeScript, fonctions serverless Vercel natives (pas de framework HTTP)
- **Stockage** : Postgres (Neon) via `@neondatabase/serverless`
- **Hebergement** : Vercel

## Documents de reference

- `docs/01-cahier-des-charges.md` : objectifs, perimetre V1/V2, criteres, cas limites, RGPD
- `docs/02-architecture-logicielle.md` : composants, services externes, sequence d'une requete, donnees stockees
- `docs/03-architecture-site.md` : pages, navigation, comportement du podium, pages d'erreur

Consulter ces documents avant toute decision de conception qui s'ecarte de ce qui y est deja tranche. Si une decision documentee doit changer, mettre a jour le document correspondant dans le meme commit.

## Perimetre V1 (important)

- **Steam uniquement.** Ne pas ajouter de code pour Epic, GOG, Ubisoft ou EA sans qu'une decision explicite l'ait ajoute au cahier des charges.
- **Pas de systeme d'inscription.** Connexion via Steam OpenID uniquement. Ne pas ajouter de formulaire d'inscription email/mot de passe.
- **Resynchronisation automatique** de la bibliotheque a chaque chargement de page, pas de bouton "actualiser" manuel.

## Regle d'architecture non negociable

Toute donnee utilisateur doit passer par un **identifiant utilisateur interne** (`user_id`, genere par le backend), jamais directement par le `SteamID64`. Le SteamID64 est stocke comme une "liaison de plateforme" (`user_id`, `platform`, `platform_id`) rattachee a cet identifiant interne. Cette regle existe pour permettre, plus tard et sans migration, l'ajout d'un vrai systeme de compte et d'autres plateformes.

Ne jamais utiliser le SteamID64 comme cle primaire ou comme identifiant de session.

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

## Langue

Le contenu utilisateur (interface, messages d'erreur, textes) est en francais. Les noms de variables, fonctions et commentaires de code restent en anglais, sauf terme metier sans equivalent clair.

## Sous-agents disponibles

Voir `.claude/agents/` : `frontend-developer`, `backend-developer`, `code-reviewer`, `documentation-writer`, `security-reviewer`.
