# Cahier des charges - Ce soir je joue a ...

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

- Humeur (ex : detente, defi, social, decouverte)
- Niveau de fatigue
- Temps de jeu disponible
- Moment de la journee (matin / apres-midi / soir), recupere automatiquement via l'heure du PC, avec possibilite de le corriger manuellement

## Moteur de decision

Une IA (API gratuite de Mistral) fait le matching entre l'etat declare par l'utilisateur et les caracteristiques des jeux disponibles dans sa bibliotheque Steam.

Donnees envoyees a l'IA pour chaque jeu candidat : titre, temps joue, date de la derniere session. Le genre n'est pas envoye : la Steam Web API ne le fournit pas dans l'appel de recuperation de bibliotheque, et l'obtenir demanderait un appel supplementaire par jeu, trop couteux pour des bibliotheques de plusieurs centaines de jeux. Piste d'amelioration possible si la qualite du matching s'avere insuffisante sans cette donnee.

Donnees attendues en retour : nom du jeu et ID Steam (pour une correspondance precise et pour permettre l'affichage de l'affiche du jeu en portrait).

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

Point de vigilance explicite du porteur de projet : etre extremement prudent sur les donnees stockees (SteamID64, historique de suggestions) et respecter le RGPD des que le site est accessible a d'autres personnes que le porteur de projet lui-meme. A creuser plus en detail avant toute ouverture publique du site : information claire sur les donnees stockees, possibilite de suppression du compte/des donnees sur demande, hebergement avec garanties claires si possible en UE.

## Stack technique (vue d'ensemble)

Voir le document d'architecture logicielle pour le detail. Resume :

- Front : Vue 3
- Back : TypeScript, fonctions serverless Vercel natives (pas de framework HTTP)
- Hebergement : Vercel dans un premier temps

## Points encore ouverts

- Justification du choix par l'IA affichee ou non sur chaque carte
