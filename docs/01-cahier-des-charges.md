# Cahier des charges - Ce soir je joue a ...

Ce document repond a trois questions simples : a qui sert ce site, jusqu'ou va la version actuelle
(V1), et quelles regles le moteur de suggestion doit respecter. Il precede les documents plus
techniques (`02-architecture-logicielle.md`, `03-architecture-site.md`, `04-deploiement-et-rollback.md`)
qui expliquent, eux, *comment* c'est construit plutot que *quoi* construire.

## Contexte et probleme

Plus une bibliotheque de jeux est grosse (Steam, Epic, GOG, etc.), plus choisir un jeu devient une charge mentale. L'utilisateur finit souvent par ne rien lancer, ou par relancer toujours les 2-3 memes jeux, sans explorer le reste de sa bibliotheque.

## Objectif

Reduire le temps entre "je veux jouer" et "je joue" en proposant une selection courte (3 jeux) et pertinente, adaptee a l'etat du moment de l'utilisateur, plutot que de le laisser naviguer sans but dans sa bibliotheque.

## Perimetre V1

- Une seule plateforme geree : **Steam**.
- Pas de systeme d'inscription : connexion directe via Steam OpenID, sans compte separe a creer.
- Resynchronisation automatique de la bibliotheque a chaque chargement de page (pas de bouton "actualiser" manuel).

## Hors perimetre V1 (a prevoir pour plus tard)

- Autres plateformes : Epic Games, GOG, Ubisoft, EA. Aucune de ces plateformes n'a d'API publique fiable equivalente a celle de Steam a ce jour ; leur integration demandera une approche differente (scraping, import manuel, ou solution a determiner selon l'evolution de ces plateformes).
- Vrai systeme de compte utilisateur (email/mot de passe ou autre methode) capable de centraliser plusieurs connexions de plateformes sous une seule identite. L'architecture technique doit neanmoins deja prevoir cette evolution (voir le document d'architecture logicielle).

## Criteres d'entree utilisateur

L'utilisateur renseigne, a chaque utilisation :

- Humeur, une ou plusieurs parmi : detente, defi, social, decouverte, nostalgie, creatif
- Niveau de fatigue : frais / ca va / fatigue / crame
- Temps de jeu disponible : ~30 min / ~1 h / ~2 h / 3 h et plus
- Moment de la journee (matin / apres-midi / soiree / nuit), recupere automatiquement via l'heure du PC, avec possibilite de le corriger manuellement

Ce que ca donne concretement une fois envoye au backend (`POST /api/suggest`, voir `back/src/criteria.ts`) :

```json
{
  "moods": ["detente", "nostalgie"],
  "fatigue": "fatigue",
  "time": "60",
  "moment": "soiree"
}
```

## Moteur de decision

Une IA (API gratuite de Mistral) fait le matching entre l'etat declare par l'utilisateur et les caracteristiques des jeux disponibles dans sa bibliotheque Steam.

Donnees envoyees a l'IA pour chaque jeu candidat : titre, temps joue, date de la derniere session. Le genre n'est pas envoye : la Steam Web API ne le fournit pas dans l'appel de recuperation de bibliotheque, et l'obtenir demanderait un appel supplementaire par jeu, trop couteux pour des bibliotheques de plusieurs centaines de jeux. Piste d'amelioration possible si la qualite du matching s'avere insuffisante sans cette donnee.

Donnees attendues en retour : nom du jeu et ID Steam (pour une correspondance precise et pour permettre l'affichage de l'affiche du jeu en portrait), plus un pourcentage de correspondance et une explication en francais, par jeu. Exemple simplifie d'un element de la reponse (le prompt complet est dans `back/src/mistral.ts`) :

```json
{
  "appid": 413150,
  "rank": 1,
  "matchPercent": 87,
  "whyThisGame": "Vous etes fatigue et vous avez une heure. Ce jeu se joue par sessions courtes, parfait pour souffler sans s'engager.",
  "whyThisRank": "..."
}
```

Le tier gratuit de l'API Mistral est juge suffisant tant que le nombre d'utilisateurs reste faible ; un passage a un plan payant sera envisage si l'usage augmente.

## Affichage des resultats

Format "podium" pour les 3 jeux proposes :

- Au centre : le jeu numero 1, carte avec arriere-plan dore, la plus grande
- A gauche : le jeu numero 2, carte avec arriere-plan argente, plus petite que la premiere
- A droite : le jeu numero 3, carte avec arriere-plan bronze, plus petite que la deuxieme

Chaque carte affiche l'affiche du jeu en format portrait, recuperee via SteamGridDB a partir de l'ID Steam renvoye par l'IA.

## Cas limites a gerer

- **Bibliotheque Steam vide ou profil non synchronise** : proposer des jeux gratuits sur Steam a la place des suggestions personnalisees, sans appel a Mistral, mais avec les memes vraies affiches SteamGridDB pour garder un podium visuellement coherent.
- **Quota de l'API Mistral depasse** : prevoir, a terme, un fallback (systeme de scoring simple sans IA) si le tier gratuit devient insuffisant.

## RGPD et donnees stockees

Point de vigilance explicite du porteur de projet : etre extremement prudent sur les donnees stockees (SteamID64, historique de suggestions) et respecter le RGPD des que le site est accessible a d'autres personnes que le porteur de projet lui-meme.

Traite : le site est en ligne publiquement (`/mentions-legales`, verifiee automatiquement en CI par `scripts/check-legal-pages.ts`) et couvre l'information claire sur les donnees stockees (identifiant interne, SteamID64 rattache comme simple liaison de plateforme, cache de bibliotheque) ainsi qu'un contact pour demander la suppression de ses donnees. Voir `docs/02-architecture-logicielle.md`, section "Donnees stockees", pour le detail technique de ce qui est effectivement en base.

Pas encore verifie : garantie explicite d'hebergement en UE (le site est heberge par Vercel Inc., sans engagement documente ici sur la localisation des donnees).

**Mesure d'audience (Google Analytics 4).** GA4 n'est pas sur la liste d'exemption de consentement de la CNIL (contrairement a un outil d'audience "privacy-friendly" bien configure) : son chargement est donc soumis a un consentement opt-in prealable. Implementation : bandeau de consentement (`front/src/components/CookieConsentBanner.vue`, choix stocke en `localStorage`) ; le script `gtag.js` n'est jamais charge tant que l'utilisateur n'a pas explicitement accepte (`front/src/lib/analytics.ts`), et le choix reste modifiable a tout moment (lien "Gerer les cookies" en pied de page et sur `/mentions-legales`). Voir `docs/02-architecture-logicielle.md`, section "Services externes", pour le detail technique.

## Stack technique (vue d'ensemble)

Voir le document d'architecture logicielle pour le detail. Resume :

- Front : Vue 3
- Back : TypeScript, fonctions serverless Vercel natives (pas de framework HTTP)
- Hebergement : Vercel dans un premier temps

## Points encore ouverts

Aucun a ce jour. (La justification du choix par l'IA, autrefois listee ici comme point ouvert, est tranchee et implementee : voir `docs/03-architecture-site.md`, section "Justification du choix de l'IA (V1)".)
