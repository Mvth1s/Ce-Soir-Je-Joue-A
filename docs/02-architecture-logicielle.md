# Architecture logicielle - Ce soir je joue a ...

## Vue d'ensemble

```
Client (Vue 3)
      |
      v
Backend (TypeScript, Vercel)
  |-- Identifiant utilisateur interne (lien vers SteamID64)
  |-- Cache bibliotheque Steam (TTL quelques heures)
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

#### Identifiant utilisateur interne

Des la V1, chaque utilisateur connecte se voit associer un identifiant interne (par exemple un UUID genere par le backend), meme en l'absence de tout systeme de compte visible.

Le SteamID64 obtenu via Steam OpenID est rattache a cet identifiant interne via une structure du type "liaisons de plateforme" (`user_id`, `platform`, `platform_id`), plutot que d'utiliser directement le SteamID64 comme cle partout dans le code.

La session de l'utilisateur (cookie, token) pointe vers cet identifiant interne, pas vers le SteamID64 brut.

Objectif : le jour ou un vrai systeme de compte (email/mot de passe ou autre) est ajoute, il suffira de brancher une nouvelle methode de connexion sur le meme identifiant interne, sans migrer la structure de donnees existante. De meme, si une deuxieme plateforme (Epic, GOG...) est integree un jour, elle viendra simplement s'ajouter comme une nouvelle "liaison de plateforme" sur ce meme identifiant.

#### Cache bibliotheque Steam

Recoit et conserve temporairement les donnees de bibliotheque recuperees via la Steam Web API (liste des jeux, temps joue, derniere session), pour eviter de solliciter l'API a chaque chargement de page malgre la resynchronisation automatique cote utilisateur.

Duree de mise en cache encore a definir (point ouvert).

## Services externes

### Steam (OpenID + Web API)

- **Steam OpenID** : gere la connexion de l'utilisateur. L'utilisateur clique "Se connecter avec Steam", est redirige vers une page Steam officielle, s'authentifie la-bas (le backend ne voit jamais son mot de passe), et Steam renvoie son SteamID64 au backend. Bibliotheque suggeree : `passport-steam` (basee sur Passport.js).
- **Steam Web API** : une fois le SteamID64 obtenu, permet de recuperer la bibliotheque de jeux, le temps joue par jeu et la date de la derniere session. API gratuite, sans quota payant pour cet usage.

### Mistral API

Recoit, pour chaque jeu candidat de la bibliotheque : titre, genre, temps joue, date de la derniere session, ainsi que les criteres declares par l'utilisateur (humeur, fatigue, temps disponible, moment de la journee).

Renvoie : le nom du jeu et son ID Steam, pour chacun des 3 jeux suggeres.

Tier gratuit utilise tant que le nombre d'utilisateurs reste faible ; passage a un plan payant a envisager si l'usage augmente.

### SteamGridDB

Utilise l'ID Steam renvoye par Mistral pour recuperer l'affiche du jeu en format portrait, affichee sur chaque carte du podium. Choisi car Steam ne fournit pas nativement d'image portrait standardisee pour tous les jeux dans son API classique (plutot des capsules horizontales ou carrees).

## Sequence d'une requete de suggestion

1. Le client charge la page ; le backend verifie l'identifiant utilisateur interne et le SteamID64 associe.
2. Le backend resynchronise automatiquement la bibliotheque Steam (via le cache si disponible et valide, sinon via un appel a la Steam Web API).
3. Si la bibliotheque est vide, le backend bascule sur une liste de jeux gratuits Steam.
4. L'utilisateur renseigne ses criteres (humeur, fatigue, temps disponible, moment de la journee).
5. Le backend envoie a Mistral la liste des jeux candidats (avec titre, genre, temps joue, derniere session) et les criteres de l'utilisateur.
6. Mistral renvoie 3 jeux (nom + ID Steam).
7. Le backend recupere l'affiche portrait de chaque jeu via SteamGridDB.
8. Le backend renvoie au client les 3 jeux, avec leurs affiches, pour l'affichage en podium.

## Donnees stockees

- Identifiant utilisateur interne
- SteamID64 associe (liaison de plateforme)
- Donnees de bibliotheque en cache (temporaire)
- Historique de suggestions (a confirmer si conserve, en lien avec le point RGPD du cahier des charges)

## Stack technique

- Front : Vue 3
- Back : TypeScript (framework precis a determiner)
- Hebergement : Vercel dans un premier temps

## Points encore ouverts

- Duree exacte de mise en cache des donnees Steam
- Choix definitif du framework backend TypeScript
- Fallback si le quota gratuit de l'API Mistral est depasse
