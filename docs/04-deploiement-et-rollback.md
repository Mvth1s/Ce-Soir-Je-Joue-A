# Déploiement et rollback

## Comment le déploiement fonctionne

- **Previews (branche `dev`, pull requests)** : gérées nativement par l'intégration Git de Vercel
  (déjà en place, voir `.vercel/project.json`). Rien à faire côté GitHub Actions : chaque push ou
  PR obtient automatiquement son URL de preview, visible comme check GitHub posé par l'app Vercel.
- **Production (branche `main`)** : `.github/workflows/ci.yml` (job `deploy-production`) construit
  et déploie explicitement via le CLI Vercel, **après** que les jobs `test` et `build` aient réussi.
  Un smoke test post-déploiement (`.github/scripts/smoke-test.sh`) vérifie que `/`, `/api/library`
  et `/api/suggest` répondent avec un statut cohérent avant de considérer le déploiement réussi.

Pour que ce gate soit réellement respecté (et pas juste redondant avec un déploiement automatique
Vercel qui partirait en parallèle sans attendre les tests), désactiver le déploiement automatique
de Vercel spécifiquement sur `main` : Project Settings → Git → Ignored Build Step, avec un script
qui ignore les builds sur `main` déclenchés par un push direct (Vercel continue de déployer les
previews sur `dev` et les PR normalement).

## Rollback manuel en cas d'échec du smoke test (ou de bug découvert après coup)

1. **Le plus rapide : re-promouvoir un déploiement précédent depuis le dashboard Vercel.**
   Project → Deployments → repérer le dernier déploiement de production sain (avant celui qui pose
   problème) → menu `···` → **Promote to Production**. Ne reconstruit rien, bascule le trafic en
   quelques secondes.
2. **Équivalent en ligne de commande** (utile si le dashboard n'est pas accessible) :
   ```bash
   vercel ls --token=$VERCEL_TOKEN                       # lister les déploiements récents
   vercel promote <url-du-déploiement-sain> --token=$VERCEL_TOKEN
   ```
3. **Si le problème vient du code lui-même** (pas seulement d'un déploiement malchanceux) :
   revert le commit fautif sur `main` (`git revert`), pousser : le workflow `ci.yml` relance
   test → build → deploy-production normalement sur ce nouveau commit.

Dans tous les cas, vérifier après coup avec `pnpm healthcheck` (ou attendre la prochaine
exécution planifiée de `.github/workflows/healthcheck.yml`) que les services externes ne sont pas
en cause.
