# Architecture du site - Ce soir je joue a ...

## Pages principales (V1)

### 1. Page d'accueil / connexion

- Presente le principe du site.
- Bouton "Se connecter avec Steam" (Steam OpenID). Pas d'inscription, pas de mot de passe a creer.

### 2. Page de saisie des criteres

Formulaire rempli a chaque utilisation, avant chaque suggestion :

- Humeur (ex : detente, defi, social, decouverte)
- Niveau de fatigue
- Temps de jeu disponible
- Moment de la journee, pre-rempli automatiquement via l'heure du PC, modifiable manuellement

### 3. Page de resultats (podium)

Affiche les 3 jeux suggeres sous forme de podium :

- Au centre : jeu numero 1, carte avec arriere-plan dore, la plus grande
- A gauche : jeu numero 2, carte avec arriere-plan argente, plus petite que la premiere
- A droite : jeu numero 3, carte avec arriere-plan bronze, plus petite que la deuxieme

Chaque carte affiche l'affiche du jeu en format portrait (recuperee via SteamGridDB).

Si la bibliotheque Steam de l'utilisateur est vide, cette page affiche a la place une selection de jeux gratuits sur Steam.

### Justification du choix de l'IA (V1)

Chaque carte peut se retourner (effet de rotation) pour reveler au dos l'explication de l'IA : pourquoi ce jeu a ete choisi, et pourquoi il occupe cette place dans le podium (1re, 2e ou 3e position).

### Bouton "reessayer" (V1.5 ou V2, pas urgent)

Un bouton "reessayer" permet de relancer une nouvelle suggestion sans ressaisir tous les criteres. Au moment du clic, une question rapide est posee a l'utilisateur (pourquoi il souhaite reessayer), afin d'alimenter et d'ameliorer les choix futurs de l'IA. Fonctionnalite jugee utile mais non urgente, prevue pour une version ulterieure a la V1.

## Pages d'erreur

Des pages/messages d'erreur stylises (coherents avec l'identite visuelle du site) sont prevus pour les erreurs qui ne relevent pas du site lui-meme : 404 (page introuvable), 403 (acces refuse), et autres erreurs HTTP similaires.

## Navigation

Parcours lineaire et simple en V1 : connexion Steam -> saisie des criteres -> resultats. Pas de tableau de bord, pas d'historique visible, pas de reglages avances, conformement au choix de ne pas ajouter de systeme de compte pour le moment.

La bibliotheque se resynchronise automatiquement a chaque chargement de page (pas de bouton "actualiser" manuel en V1).

## Points encore ouverts

- Contenu exact de l'explication affichee au dos de chaque carte (texte libre genere par l'IA, ou format plus structure ?)
- Liste precise des questions posees lors d'un clic sur "reessayer" (V1.5/V2)
- Ecran ou message specifique en cas d'echec de connexion Steam ou de la Steam Web API (distinct des erreurs 404/403) : non discute pour le moment.
