# Architecture logicielle - Ce soir je joue a ...

## Vue d'ensemble

```
Client (Vue 3)
      |
      v
Backend (TypeScript, Vercel)
  |-- Identifiant utilisateur interne (lien vers SteamID64)
  |-- Cache bibliotheque Steam (TTL 4h)
      |            |            |
      v            v            v
   Steam       Mistral API   SteamGridDB
(OpenID +      (matching     (affiches
 Web API)         IA)         portrait)
```

Le front ne parle jamais directement a Steam, Mistral ou SteamGridDB : tout passe par le backend, qui centralise les appels et met en cache ce qui peut l'etre.

## Composants

### Client (Vue 3)

Interface utilisateur : ecran de connexion Steam, formulaire de criteres (humeur, fatigue, temps disponible, moment de la journee), affichage des 3 resultats en format podium.

### Backend (TypeScript)

Orchestre l'ensemble des appels externes et applique la logique metier (cas de bibliotheque vide, cache, etc.). Hebergement prevu sur Vercel dans un premier temps.

Pas de framework HTTP (Fastify, Nest, Express...) : le backend est constitue de fonctions serverless Vercel natives, des handlers `(req, res)` places sous `api/*.ts` (convention zero-config de Vercel, un fichier = une route). La logique metier (auth, cache, matching, etc.) vit dans `back/src/`, importee par ces handlers. Choix motive par la simplicite de deploiement sur Vercel et l'absence de besoin de routage avance en V1.

#### Identifiant utilisateur interne

Des la V1, chaque utilisateur connecte se voit associer un identifiant interne (par exemple un UUID genere par le backend), meme en l'absence de tout systeme de compte visible.

Le SteamID64 obtenu via Steam OpenID est rattache a cet identifiant interne via une structure du type "liaisons de plateforme" (`user_id`, `platform`, `platform_id`), plutot que d'utiliser directement le SteamID64 comme cle partout dans le code.

La session de l'utilisateur pointe vers cet identifiant interne, pas vers le SteamID64 brut. Implementation : `iron-session`, cookie chiffre `httpOnly`, `secure` en production, `sameSite=lax`, ne contenant que le `user_id` interne.

Objectif : le jour ou un vrai systeme de compte (email/mot de passe ou autre) est ajoute, il suffira de brancher une nouvelle methode de connexion sur le meme identifiant interne, sans migrer la structure de donnees existante. De meme, si une deuxieme plateforme (Epic, GOG...) est integree un jour, elle viendra simplement s'ajouter comme une nouvelle "liaison de plateforme" sur ce meme identifiant.

#### Cache bibliotheque Steam

Recoit et conserve temporairement les donnees de bibliotheque recuperees via la Steam Web API (liste des jeux, temps joue, derniere session), pour eviter de solliciter l'API a chaque chargement de page malgre la resynchronisation automatique cote utilisateur.

Duree de mise en cache (TTL) : 4 heures (`LIBRARY_CACHE_TTL_MS`, `back/src/library.ts`).

#### Stockage persistant (Postgres)

Les fonctions serverless Vercel n'ont pas de memoire entre deux invocations : l'identifiant utilisateur interne, les liaisons de plateforme et le cache bibliotheque doivent donc etre persistes ailleurs qu'en memoire process. Choix : Postgres (Neon, via le client HTTP `@neondatabase/serverless`), pas de Redis. `@vercel/postgres` (deprecie par son editeur) a ete utilise initialement puis retire au profit de ce client.

Trois tables :

- `users` : identifiant utilisateur interne (`user_id`).
- `platform_links` : liaison de plateforme (`user_id`, `platform`, `platform_id`), voir "Identifiant utilisateur interne" ci-dessus.
- `library_cache` : bibliotheque Steam en cache par utilisateur, avec horodatage pour appliquer le TTL de 4 heures.

## Services externes

### Steam (OpenID + Web API)

- **Steam OpenID** : gere la connexion de l'utilisateur. L'utilisateur clique "Se connecter avec Steam", est redirige vers une page Steam officielle, s'authentifie la-bas (le backend ne voit jamais son mot de passe), et Steam renvoie son SteamID64 au backend. Implementation : `RelyingParty` du paquet `openid`, en mode stateless (aucune session serveur pour l'association/le nonce, verification faite directement aupres de Steam a chaque callback). `passport-steam` a ete ecarte : il suppose une app Express avec middleware de session, incompatible avec des fonctions serverless Vercel independantes (voir `back/src/steamAuth.ts`).
- **Steam Web API** : une fois le SteamID64 obtenu, permet de recuperer la bibliotheque de jeux, le temps joue par jeu et la date de la derniere session. API gratuite, sans quota payant pour cet usage.

### Mistral API

**Modele utilise : `mistral-small-latest`** (constante `MISTRAL_MODEL`, `back/src/mistral.ts`), un petit modele generaliste rapide, suffisant pour cette tache de classement/matching et disponible sur le tier gratuit de Mistral. Appele avec `temperature: 0.3` (reponses peu variables d'un run a l'autre) et `response_format: { type: "json_object" }` (force une reponse JSON stricte).

Recoit, pour chaque jeu candidat de la bibliotheque : titre, temps joue, date de la derniere session, ainsi que les criteres declares par l'utilisateur (humeur, fatigue, temps disponible, moment de la journee). Le genre n'est pas envoye : la Steam Web API ne le fournit pas dans l'appel de recuperation de bibliotheque (`GetOwnedGames`), et l'obtenir demanderait un appel supplementaire par jeu (un par `appid`), trop couteux pour des bibliotheques de plusieurs centaines de jeux. Piste d'amelioration possible si necessaire a la qualite du matching.

Renvoie : pour chacun des 3 jeux suggeres, son ID Steam (`appid`), son rang (1 a 3), un pourcentage de correspondance, et deux courtes justifications en francais (pourquoi ce jeu, pourquoi ce rang). Le nom du jeu, le temps joue et la derniere session affiches ensuite viennent des donnees source (`candidates`), jamais de la reponse de l'IA, qui pourrait les halluciner ou les reformuler (voir `buildSuggestions` dans `back/src/mistral.ts`).

Tier gratuit utilise tant que le nombre d'utilisateurs reste faible ; passage a un plan payant a envisager si l'usage augmente.

#### Exemple de prompt envoye a Mistral

Genere par `buildPrompt()` (`back/src/mistral.ts`). Le message systeme cadre le role de l'IA ; le message utilisateur (ci-dessous, avec des valeurs d'exemple) porte la liste de jeux candidats et l'etat du joueur :

```
Contexte : le site "Ce soir je joue a ..." aide un joueur a choisir quoi jouer ce soir parmi les jeux Steam qu'il possede deja. Tu dois lui suggerer exactement 3 jeux, classes du plus pertinent (rang 1) au moins pertinent (rang 3), a partir de la liste de jeux candidats ci-dessous et de son etat du moment.

Jeux candidats (bibliotheque Steam du joueur) :
- appid 570 : "Dota 2", 320.5h joues au total, derniere session : 2026-08-03
- appid 730 : "Counter-Strike 2", 84.0h joues au total, derniere session : 2026-07-28
- appid 1145360 : "Hades", 12.5h joues au total, derniere session : 2026-06-11
[... jusqu'a 40 jeux candidats]

Etat du joueur ce soir :
- Humeur(s) : detente, decouverte
- Niveau de fatigue : fatigue
- Temps disponible : 60 minutes
- Moment de la journee : soir

Consignes :
- Choisis exactement 3 jeux, uniquement parmi les jeux candidats listes ci-dessus (utilise leur appid exact, ne jamais inventer ou choisir un jeu hors liste).
- Classe-les avec rank 1 (le meilleur choix), rank 2 et rank 3.
- Pour chaque jeu, donne un matchPercent (0 a 100) qui reflete a quel point ce jeu correspond a l'etat du joueur.
- whyThisGame : explique en francais, en 1 a 2 phrases, ton direct, pourquoi ce jeu correspond a son etat de ce soir (humeur, fatigue, temps disponible, moment de la journee). Exemple de ton attendu : "Vous etes fatigue et vous avez une heure. Ce jeu se joue par sessions courtes, parfait pour souffler sans s'engager."
- whyThisRank : explique en francais, en 1 a 2 phrases, pourquoi ce jeu occupe precisement ce rang plutot qu'un autre parmi les 3 proposes.
- Reponds uniquement avec un objet JSON de la forme exacte suivante, sans texte avant ou apres :
{"suggestions": [{"appid": number, "rank": 1 | 2 | 3, "matchPercent": number, "whyThisGame": string, "whyThisRank": string}, ...3 elements au total]}
```

Le message systeme associe : *"Tu es un assistant qui choisit des jeux video a proposer a un joueur pour sa soiree. Tu reponds uniquement avec du JSON strict respectant exactement le format demande, sans aucun texte hors JSON."*

La liste de jeux candidats n'est jamais la bibliotheque complete : voir `selectCandidates()` (meme fichier) pour la construction de la shortlist deterministe de 40 jeux maximum (section "Sequence d'une requete de suggestion" ci-dessous).

### SteamGridDB

Utilise l'ID Steam renvoye par Mistral pour recuperer l'affiche du jeu en format portrait, affichee sur chaque carte du podium. Choisi car Steam ne fournit pas nativement d'image portrait standardisee pour tous les jeux dans son API classique (plutot des capsules horizontales ou carrees).

### Google Analytics 4 (mesure d'audience)

Seul service externe appele directement depuis le navigateur plutot que via le backend (le front ne fait ici que charger un script tiers, il n'y a pas de donnee utilisateur du site a proteger dans cet appel comme pour Steam/Mistral/SteamGridDB). Identifiant de mesure fourni par `VITE_GA_MEASUREMENT_ID` (voir `.env.example` et README). Chargement conditionne au consentement de l'utilisateur (voir section RGPD du cahier des charges) :

- `front/src/lib/analytics.ts` : injection differee du script `gtag.js`, jamais executee tant que le consentement n'a pas ete donne. `send_page_view` est desactive dans la config GA (`gtag("config", ...)`) : les `page_view` sont envoyes manuellement a chaque changement de route (hook `router.afterEach`, `front/src/router/index.ts`), necessaire car c'est une SPA sans rechargement complet entre les pages.
- `front/src/composables/useCookieConsent.ts` : etat du consentement (`accepted` / `refused` / non renseigne), persiste en `localStorage`, reactif : charge ou decharge GA des que le choix change. Aucun consentement enregistre par defaut (opt-in strict).
- `front/src/components/CookieConsentBanner.vue` : bandeau affiche tant qu'aucun choix n'a ete fait, en `position: fixed` bas d'ecran. Pour eviter qu'il ne masque le pied de page (et ses liens) pendant qu'il est affiche, `front/src/App.vue` reserve l'espace correspondant via un `padding-bottom` en CSS statique (`clamp()`, ajuste empiriquement sur la hauteur reelle du bandeau), applique tant que `useCookieConsent().choice === null`. Ecarte volontairement une mesure JS de la hauteur reelle du bandeau (ex. `ResizeObserver`) : ça provoquait un second rendu apres l'affichage initial, donc un vrai Cumulative Layout Shift, detecte par le job CI `lighthouse.yml`.
- Si `VITE_GA_MEASUREMENT_ID` est vide (ex. environnements de dev/preview sans propriete GA4 dediee), le script n'est jamais charge, meme apres acceptation.

## Sequence d'une requete de suggestion

1. Le client charge la page ; le backend verifie l'identifiant utilisateur interne et le SteamID64 associe.
2. Le backend resynchronise automatiquement la bibliotheque Steam (via le cache si disponible et valide, sinon via un appel a la Steam Web API).
3. Si la bibliotheque est vide, le backend bascule sur une liste de jeux gratuits Steam.
4. L'utilisateur renseigne ses criteres (humeur, fatigue, temps disponible, moment de la journee).
5. Le backend construit une shortlist deterministe d'au plus 40 jeux candidats (priorite aux jeux recemment joues et aux jeux les plus joues, complete si besoin) plutot que d'envoyer la bibliotheque complete, puis l'envoie a Mistral (avec titre, temps joue, derniere session pour chaque jeu) avec les criteres de l'utilisateur.
6. Mistral renvoie 3 jeux (nom + ID Steam).
7. Le backend recupere l'affiche portrait de chaque jeu via SteamGridDB.
8. Le backend renvoie au client les 3 jeux, avec leurs affiches, pour l'affichage en podium.

## Donnees stockees

Persistees en Postgres (voir "Stockage persistant (Postgres)" ci-dessus) :

- Identifiant utilisateur interne (table `users`)
- SteamID64 associe (liaison de plateforme, table `platform_links`)
- Donnees de bibliotheque en cache, temporaire, TTL 4h (table `library_cache`)
- Historique de suggestions (a confirmer si conserve, en lien avec le point RGPD du cahier des charges) : non implemente a ce jour, aucune table associee.

## Stack technique

- Front : Vue 3
- Back : TypeScript, fonctions serverless Vercel natives sous `api/*.ts` (pas de framework HTTP), logique metier dans `back/src/`
- Stockage persistant : Postgres (Neon, via `@neondatabase/serverless`)
- Hebergement : Vercel dans un premier temps

## Points encore ouverts

- Fallback si le quota gratuit de l'API Mistral est depasse
