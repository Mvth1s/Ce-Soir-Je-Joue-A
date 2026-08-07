# Tests end-to-end (Playwright)

Ce dossier contient les tests end-to-end du site, executes avec [Playwright](https://playwright.dev)
contre une vraie instance du front (Vite) et de l'API (`scripts/e2e-server.ts`).

## Ce qui est teste

- `pages.spec.ts` : chargement de chaque page publique, redirections des pages protegees.
- `login.spec.ts` : connexion Steam (simulee), persistance de session, echec de connexion.
- `suggestion-flow.spec.ts` : criteres -> podium, retournement au survol, clic vers la fiche Steam.
- `edge-cases.spec.ts` : bibliotheque vide (repli jeux gratuits), echec du calcul de suggestions.
- `responsive.spec.ts` : absence de scroll horizontal, disposition du podium et captures de
  reference sur 7 tailles d'ecran (mobile, tablette, desktop, grand ecran).

## Aucun compte Steam ni cle d'API reelle necessaire

Tous les services externes (Steam OpenID, Steam Web API, Mistral, SteamGridDB) sont simules :

- **Steam OpenID** (`support/steamAuthMock.ts` + `support/loginAs.ts`) : le paquet `openid` fait
  ses requetes via `axios`, que [`nock`](https://github.com/nock/nock) intercepte fidelement
  (verifie contre le code source du paquet installe). Cote navigateur, Playwright intercepte la
  seule requete visible (la redirection vers `steamcommunity.com/openid/login`) pour simuler une
  connexion reussie ou refusee. **Aucun fichier de `back/src/` ou `api/` n'est modifie pour ce
  mock** : tout vit dans `tests/e2e/`.
- **Steam Web API, Mistral, SteamGridDB** (`support/externalApiMocks.ts`) : ces trois services
  sont appeles via `fetch` (undici) cote backend ; un `MockAgent` undici les intercepte, avec
  `enableNetConnect()` pour laisser passer tout le reste (notamment le driver Postgres, qui utilise
  aussi `fetch` mais doit atteindre une vraie base, voir plus bas).

Les seuls "utilisateurs" de test sont deux SteamID64 fixes (`tests/e2e/fixtures/library.ts`) :
un avec une bibliotheque de demonstration, un reserve au cas "bibliotheque vide".

## Prerequis pour lancer les tests en local

1. `pnpm install` puis, une seule fois, `npx playwright install chromium`.
2. Une vraie base Postgres (Neon) accessible via `DATABASE_URL` — **c'est la seule variable qui
   doit deja exister dans l'environnement appelant** (le driver `@neondatabase/serverless` parle
   HTTP directement a Neon, pas de protocole Postgres brut : impossible de le faire pointer vers un
   Postgres local sans proxy dedie). Recommande : une branche Neon dediee aux tests plutot que
   votre base de dev, pour ne pas la polluer avec les utilisateurs de test. Appliquer le schema une
   fois : `psql "$DATABASE_URL" -f back/src/db/schema.sql`.
3. Toutes les autres variables (`SESSION_SECRET`, `PUBLIC_BASE_URL`, `STEAM_API_KEY`,
   `MISTRAL_API_KEY`, `STEAMGRIDDB_API_KEY`) sont deja fournies avec des valeurs factices dans
   `playwright.config.ts` (`webServer[0].env`) : rien a configurer, elles ne servent qu'a passer les
   verifications de presence du backend (`if (!apiKey) throw ...`), jamais de vrai appel reseau.

```bash
export DATABASE_URL="postgres://...neon-test-branch..."
pnpm exec playwright test
```

Playwright demarre lui-meme le front (`pnpm --filter front dev`) et l'API de test
(`tsx scripts/e2e-server.ts`) via `webServer` dans `playwright.config.ts`.

## Un seul navigateur (chromium)

Les tests de regression visuelle comparent des captures d'ecran pixel par pixel : des moteurs de
rendu differents (WebKit, Firefox) produiraient des references differentes pour la meme page. On
ne teste donc que sur Chromium. Si un bug specifique a Safari/Firefox est suspecte, l'investiguer
manuellement plutot que d'ajouter ces moteurs a la suite automatisee.

## Captures de reference (regression visuelle)

Les baselines (`tests/e2e/__screenshots__/`) ne sont **generees et comparees qu'en CI**
(voir `.github/workflows/ci.yml`), jamais en local : le rendu des polices peut varier legerement
d'une machine a l'autre, ce qui produirait des faux positifs.

- Le job `test` de la CI lance la suite normalement (`playwright test`) : si une baseline existe et
  que le rendu a change, le test echoue avec une image de diff jointe au rapport (`playwright-report`,
  disponible en artefact du workflow).
- **Premiere execution / mise a jour volontaire du visuel** : declencher manuellement le workflow
  `update-visual-baselines.yml` (onglet Actions -> "Run workflow"), qui lance
  `playwright test --update-snapshots` et pousse les nouvelles images sur la branche
  `chore/update-visual-baselines`. Le workflow ne peut pas ouvrir lui-meme la pull request (les
  Actions GitHub n'ont pas la permission de creer des PR sur ce depot) : ouvrir la PR a la main
  depuis cette branche une fois le workflow termine. Relire cette PR comme n'importe quelle revue
  de code avant de merger : elle doit correspondre a un changement visuel voulu, pas a une
  regression.

## Deboguer un test qui echoue

```bash
pnpm exec playwright test --ui        # mode interactif
pnpm exec playwright show-report      # dernier rapport HTML (traces, captures d'echec)
```
