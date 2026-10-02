// Source unique des questions/reponses de la FAQ : affichees par
// front/src/pages/FaqPage.vue et reprises telles quelles dans les donnees
// structurees FAQPage (front/src/lib/structuredData.ts), dont le texte doit
// correspondre exactement au contenu visible de la page.
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment l'IA choisit-elle mes 3 jeux ?",
    answer:
      "Une IA (Mistral AI, modèle mistral-small-latest) reçoit une sélection de vos jeux Steam les plus joués ou les plus récents (40 maximum, pour rester rapide) ainsi que votre humeur, votre fatigue, le temps disponible et le moment de la journée. Elle renvoie 3 jeux classés, avec pour chacun un pourcentage de correspondance et une explication. Le détail technique (prompt exact envoyé) est documenté dans le code source, lien en pied de page.",
  },
  {
    question: "Est-ce que le site voit mon mot de passe Steam ?",
    answer:
      "Non, jamais. La connexion passe entièrement par la page officielle de Steam (OpenID) : vous vous identifiez chez Steam, qui confirme ensuite votre identité au site. Aucun mot de passe ne transite par ce site ni n'y est stocké.",
  },
  {
    question: "Quelles données sont conservées, et combien de temps ?",
    answer:
      "Un identifiant interne est créé pour votre compte, auquel est rattaché votre identifiant Steam. Votre bibliothèque (jeux, temps joué, dernière session) est mise en cache 4 heures pour éviter de solliciter Steam à chaque page. Rien n'est revendu ni partagé. Détails complets dans les mentions légales.",
  },
  {
    question: "Le bouton \"Lancer\" ouvre-t-il vraiment le jeu ?",
    answer:
      "Oui : il utilise un lien steam://rungameid/... qui demande au client Steam installé sur votre ordinateur d'ouvrir directement le jeu. Si Steam n'est pas installé ou pas lancé, votre navigateur affichera une erreur ou une demande d'autorisation à la place.",
  },
  {
    question: "Ma bibliothèque Steam est vide (ou privée), que se passe-t-il ?",
    answer:
      "Le site vous propose à la place une petite sélection de jeux gratuits sur Steam, avec les mêmes vraies affiches, pour garder un podium cohérent même sans bibliothèque personnelle à analyser.",
  },
  {
    question: "Puis-je changer mes critères sans tout recommencer ?",
    answer:
      "Oui : depuis la page de résultats, \"Modifier mes critères\" vous ramène au formulaire avec vos réponses déjà en mémoire, et \"Relancer une suggestion\" redemande simplement 3 nouveaux jeux avec les mêmes critères.",
  },
  {
    question: "Le site est-il gratuit ?",
    answer:
      "Oui, entièrement. C'est un projet personnel qui fonctionne sur les tiers gratuits de Steam, Mistral AI et SteamGridDB.",
  },
  {
    question: "Où trouver le code source ou signaler un problème ?",
    answer:
      "Le code est public sur GitHub, lien en pied de page. Vous pouvez y ouvrir une issue pour signaler un bug ou une idée.",
  },
];
