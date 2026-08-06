# Ce soir je joue à...

## C'est quoi ?

Un petit site qui répond à une question toute simple : *"j'ai envie de jouer, mais à quoi ?"*

Plus une bibliothèque Steam grossit, plus choisir un jeu devient une corvée : on finit par relancer toujours les 2-3 mêmes, ou par ne rien lancer du tout. Ce site regarde ta vraie bibliothèque Steam et te propose seulement **3 jeux**, choisis pour correspondre à ton état du moment.

## Comment ça marche, en gros

1. **Tu te connectes avec Steam.** Une page de présentation t'accueille d'abord, puis tu cliques "Se connecter avec Steam" : pas de compte à créer, pas de mot de passe à inventer, tu passes par la page officielle de Steam et c'est tout. Le site ne voit jamais ton mot de passe.
2. **Tu dis où tu en es ce soir.** Ton humeur (détente, défi, envie de découvrir...), ton niveau de fatigue, le temps que tu as devant toi, et le moment de la journée (déjà pré-rempli automatiquement).
3. **Une IA regarde ta bibliothèque et choisit 3 jeux.** Elle prend en compte ce que tu as déjà joué, depuis combien de temps, et ce que tu viens de lui dire sur ton état, et elle explique son choix. Il s'agit de [Mistral AI](https://mistral.ai) (modèle `mistral-small-latest`) ; le détail du prompt envoyé est documenté dans `docs/02-architecture-logicielle.md`.
4. **Les 3 jeux s'affichent en podium** (or, argent, bronze), avec l'affiche de chaque jeu. Une carte se retourne pour lire pourquoi ce jeu a été choisi, et pourquoi il est à cette place.

Si ta bibliothèque Steam est vide, le site te propose à la place une petite sélection de jeux gratuits sur Steam.

<details>
<summary>Concrètement, qu'est-ce qui part vers l'IA et qu'est-ce qui en revient ?</summary>

Pas besoin de comprendre ce détail pour utiliser le site — c'est juste pour les curieux. Le site envoie à l'IA ta bibliothèque (nom du jeu, temps joué, dernière session) et ton état du moment, en langage à peu près comme ça :

```
Jeux candidats (bibliotheque Steam du joueur) :
- appid 413150 : "Stardew Valley", 80.3h joues au total, derniere session : il y a 3 jours

Etat du joueur ce soir :
- Humeur(s) : detente, nostalgie
- Niveau de fatigue : fatigue
- Temps disponible : 60 minutes
- Moment de la journee : soiree
```

Et elle répond avec exactement 3 jeux choisis parmi cette liste (jamais un jeu inventé), classés, chacun avec une explication en français :

```json
{"suggestions": [
  {"appid": 413150, "rank": 1, "matchPercent": 87,
   "whyThisGame": "Vous etes fatigue et vous avez une heure...",
   "whyThisRank": "..."}
]}
```

Le texte que tu lis en retournant une carte, c'est directement cette explication de l'IA — le site ne le réécrit pas.

</details>

## De quoi le site est fait

- **Ce que tu vois** (les pages, les boutons, le podium) : dossier `front/`
- **Ce qui tourne côté serveur** (connexion Steam, appel à l'IA, récupération des affiches, base de données) : dossiers `back/` et `api/`
- **Les documents qui expliquent les choix de conception en détail** : dossier `docs/`

Pas besoin d'aller plus loin dans le détail technique pour utiliser ou faire évoluer le site à haut niveau : les documents dans `docs/` sont là si tu veux creuser un point précis.

## Informations légales

Éditeur, hébergement, code source et traitement des données personnelles sont détaillés sur une page dédiée du site, accessible depuis le pied de page (`/mentions-legales`) une fois le site lancé.

## Licence

Ce projet est distribué sous licence [GNU GPL v3](LICENSE) (ou, à ton choix, toute version ultérieure). Tu peux réutiliser, modifier et redistribuer le code, à condition que toute version modifiée ou redistribuée reste elle aussi sous GPL v3 et fournisse son code source.

## Lancer le site sur ton ordinateur

### Ce qu'il te faut avant de commencer

- [Node.js](https://nodejs.org) installé.
- Le gestionnaire de paquets `pnpm` (`npm install -g pnpm` si tu ne l'as pas).
- Une base de données Postgres : ce projet utilise [Neon](https://neon.tech) (un hébergeur Postgres qui fonctionne bien avec des projets serverless comme celui-ci). Le plus simple : crée un compte gratuit directement sur neon.tech, ou ajoute l'intégration "Neon" au Marketplace de ton projet Vercel si tu en as déjà un. Vercel ne propose plus sa propre offre "Vercel Postgres" — elle a été remplacée par ces intégrations tierces.
- Trois clés d'API gratuites, une par service utilisé par le site :

| Variable | À quoi ça sert | Où l'obtenir |
|---|---|---|
| `STEAM_API_KEY` | Lire ta bibliothèque Steam | [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) |
| `MISTRAL_API_KEY` | Le choix des 3 jeux par l'IA | [console.mistral.ai](https://console.mistral.ai) |
| `STEAMGRIDDB_API_KEY` | Les affiches des jeux | [steamgriddb.com/profile/preferences/api](https://www.steamgriddb.com/profile/preferences/api) |

### Les étapes

1. **Installer les dépendances**, à la racine du projet :
   ```
   pnpm install
   ```

2. **Créer ton fichier `.env`** en copiant l'exemple fourni, puis en remplissant les valeurs :
   ```
   cp .env.example .env
   ```
   En plus des 3 clés ci-dessus, il faut aussi remplir :
   - `SESSION_SECRET` : une phrase secrète aléatoire d'au moins 32 caractères (sert à sécuriser la connexion). Tu peux en générer une avec `openssl rand -base64 32`.
   - `DATABASE_URL` : l'adresse de ta base Postgres.
   - `PUBLIC_BASE_URL` : l'adresse que ton navigateur utilise pour ouvrir le site en local (celle
     qui gère le retour de connexion Steam), normalement `http://localhost:5173` — pas le port 3000
     de l'API, que le navigateur ne contacte jamais directement.

3. **Préparer la base de données**, une seule fois (crée les tables nécessaires) :
   ```
   psql "$DATABASE_URL" -f back/src/db/schema.sql
   ```

4. **Lancer le site.** Il y a deux parties qui tournent séparément : la partie visible (le site, servi par Vite sur le port 5173) et la partie serveur (connexion Steam, IA..., servie par un petit serveur local sur le port 3000). Vite redirige automatiquement les appels serveur vers le port 3000, donc dans ton navigateur tu ouvres toujours **`http://localhost:5173`**, jamais le 3000 directement.

   - **Tout lancer d'un coup** (le cas normal, pour utiliser le site en entier) :
     ```
     pnpm dev:full
     ```
     Ouvre ensuite `http://localhost:5173` dans ton navigateur.

   - **Lancer seulement la partie visible** (pratique pour retoucher juste l'affichage sans toucher au serveur) :
     ```
     pnpm dev
     ```
     ⚠️ Sans la partie serveur en face, tous les boutons qui parlent au serveur (connexion Steam, recherche de jeux...) donneront une erreur de connexion.

   - **Lancer seulement la partie serveur** (pratique pour tester une route ou regarder ses logs sans le site) :
     ```
     pnpm dev:api
     ```
     Les routes sont alors disponibles directement sur `http://localhost:3000/api/...`.

### Vérifier que tout va bien sans lancer le site

```
pnpm typecheck
pnpm build
```
Ces deux commandes vérifient que le code est valide et que le site se construit correctement, sans avoir besoin des clés d'API ni de la base de données.
