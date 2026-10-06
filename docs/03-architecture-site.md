# Architecture du site - Ce soir je joue a ...

## Pages principales (V1)

### 1. Page d'atterrissage (`/`)

- Presente le principe du site (accroche, apercu visuel du podium, les 3 etapes du parcours, section de reassurance : lecture seule, pas de mot de passe stocke, donnees minimales). L'etape "votre podium" precise que le classement est fait par IA (Mistral) ; voir `docs/02-architecture-logicielle.md` (section "Mistral API") pour le modele exact et un exemple de prompt.
- Bouton d'appel a l'action qui mene vers la page de connexion (`/connexion`), pas de connexion Steam directe depuis cette page.

### 2. Page de connexion (`/connexion`)

- Bouton "Se connecter avec Steam" (Steam OpenID). Pas d'inscription, pas de mot de passe a creer.
- Affiche un message discret en cas d'echec de connexion (`?auth_error=1`).

### 3. Page de saisie des criteres

Formulaire rempli a chaque utilisation, avant chaque suggestion :

- Humeur (ex : detente, defi, social, decouverte)
- Niveau de fatigue
- Temps de jeu disponible
- Moment de la journee, pre-rempli automatiquement via l'heure du PC, modifiable manuellement

### 4. Page de resultats (podium)

Affiche les 3 jeux suggeres sous forme de podium :

- Au centre : jeu numero 1, carte avec arriere-plan dore, la plus grande
- A gauche : jeu numero 2, carte avec arriere-plan argente, plus petite que la premiere
- A droite : jeu numero 3, carte avec arriere-plan bronze, plus petite que la deuxieme

Chaque carte affiche l'affiche du jeu en format portrait (recuperee via SteamGridDB).

Le bouton "Lancer {jeu}" du jeu numero 1 utilise le lien `steam://rungameid/{appid}`, qui ouvre le client Steam installe et lance directement le jeu (au lieu de renvoyer vers la fiche magasin, peu utile si le jeu est deja possede).

Si la bibliotheque Steam de l'utilisateur est vide, cette page affiche a la place une selection de jeux gratuits sur Steam.

### Justification du choix de l'IA (V1)

Chaque carte peut se retourner (effet de rotation) pour reveler au dos l'explication de l'IA : pourquoi ce jeu a ete choisi, et pourquoi il occupe cette place dans le podium (1re, 2e ou 3e position).

### Bouton "reessayer" (V1.5 ou V2, pas urgent)

Un bouton "reessayer" permet de relancer une nouvelle suggestion sans ressaisir tous les criteres. Au moment du clic, une question rapide est posee a l'utilisateur (pourquoi il souhaite reessayer), afin d'alimenter et d'ameliorer les choix futurs de l'IA. Fonctionnalite jugee utile mais non urgente, prevue pour une version ulterieure a la V1.

### 5. Page mentions legales (`/mentions-legales`)

Editeur (pseudo + contact), hebergement (Vercel), lien vers le code source (repo GitHub public), et un resume du traitement des donnees personnelles qui reprend le point de vigilance RGPD du `docs/01-cahier-des-charges.md`. Accessible depuis le footer, present sur tous les ecrans.

### 6. Page FAQ (`/faq`)

Questions frequentes en accordeon (`<details>`/`<summary>`, sans JS supplementaire) : fonctionnement du matching IA, donnees stockees, mot de passe Steam, bouton "Lancer", bibliotheque vide, modification des criteres, gratuite du site, code source. Accessible depuis le footer, present sur tous les ecrans.

### 7. Page changelog (`/changelog`)

Liste les nouveautes et corrections par version, generees par `semantic-release` a chaque release et republiees dans `front/public/CHANGELOG.md` a chaque deploiement (`scripts/generate-changelog.ts`, voir `release.config.js` et la section "Commits et changelog" de `CLAUDE.md`). Affiche un message si le fichier est indisponible. Accessible depuis le footer, present sur tous les ecrans.

## Pied de page

Present sur tous les ecrans (`AppFooter.vue`, monte une fois dans `App.vue`) : marque du site (lien vers l'accueil), tagline, liens vers la FAQ, le changelog, les mentions legales et le code source, resume du stack technique et credit de l'auteur. Contient aussi un bouton "Gerer les cookies" qui rouvre le bandeau de consentement (voir ci-dessous).

## Bandeau de consentement cookies

Affiche (`CookieConsentBanner.vue`, monte dans `App.vue`) tant que l'utilisateur n'a pas fait de choix (accepter/refuser la mesure d'audience Google Analytics 4). Le choix est memorise et n'est plus redemande, mais reste modifiable a tout moment via le pied de page ou la page mentions legales. Voir `docs/01-cahier-des-charges.md` (section RGPD) et `docs/02-architecture-logicielle.md` (section "Google Analytics 4") pour le detail.

## Pages d'erreur

Des pages/messages d'erreur stylises (coherents avec l'identite visuelle du site) sont prevus pour les erreurs qui ne relevent pas du site lui-meme : 404 (page introuvable), 403 (acces refuse), et autres erreurs HTTP similaires.

Sur la page de resultats, un echec du calcul des suggestions affiche un ecran d'erreur avec "Reessayer" et "Modifier mes criteres". Deux variantes de message : generique ("Impossible de calculer vos suggestions pour le moment") et service sature ("Le service de suggestions est sature", quand l'API repond 503 `service_busy` parce que le quota Mistral est depasse).

## Navigation

Parcours lineaire et simple en V1 : atterrissage -> connexion Steam -> saisie des criteres -> resultats. Pas de tableau de bord, pas d'historique visible, pas de reglages avances, conformement au choix de ne pas ajouter de systeme de compte pour le moment.

La bibliotheque se resynchronise automatiquement a chaque chargement de page (pas de bouton "actualiser" manuel en V1).

## Referencement (SEO/GEO) et pre-rendu

Le site reste une SPA statique (pas de SSR a la demande, pas de fonction de rendu deployee), mais les pages publiques (`/`, `/faq`, `/mentions-legales`, `/changelog`, marquees `indexable` dans `front/src/router/routes.ts`) sont **pre-rendues au build** par `scripts/prerender.ts` (derniere etape de `pnpm --filter front build`, via un build serveur de `front/src/entry-server.ts`). Chaque page publique a donc son propre fichier `front/dist/<route>/index.html`, qui contient deja son contenu et ses balises head en dur : title, description, canonical absolu (sans query string ni slash final), `robots`, Open Graph/Twitter (image `front/public/og/cover-1200x630.png`, surchargeable par route via `meta.ogImage`) et donnees structurees JSON-LD (graphe commun WebSite/WebApplication/auteur, fil d'Ariane hors accueil, FAQPage sur `/faq` generee depuis `front/src/content/faq.ts`).

- Cote client, l'application est montee normalement (pas d'hydratation) et remplace le contenu pre-rendu ; les navigations suivantes mettent a jour les memes balises via `front/src/lib/seo.ts`.
- Toutes les autres URL (routes privees `/connexion`, `/criteres`, `/resultats`, `/403`, et 404) sont servies par `front/dist/spa.html`, un shell sans contenu en `noindex` et sans canonical (`vercel.json`, rewrites). Les pages publiques hors accueil y ont une reecriture explicite vers leur `index.html`, verifiee par le script de pre-rendu.
- `/changelog` n'a que ses balises head pre-rendues : son contenu est charge au runtime depuis `/CHANGELOG.md`.
- `robots.txt` et `sitemap.xml` ne listent/n'autorisent que ces pages publiques.

## Points encore ouverts

- Contenu exact de l'explication affichee au dos de chaque carte (texte libre genere par l'IA, ou format plus structure ?)
- Liste precise des questions posees lors d'un clic sur "reessayer" (V1.5/V2)
- Ecran ou message specifique en cas d'echec de connexion Steam ou de la Steam Web API (distinct des erreurs 404/403) : non discute pour le moment. Traitement minimal en place : redirection vers `/connexion?auth_error=1`, qui affiche un message discret pres du bouton "Se connecter avec Steam". Rien de plus elabore n'a ete concu.
