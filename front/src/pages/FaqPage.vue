<script setup lang="ts">
interface FaqItem {
  question: string;
  answer: string;
}

const items: FaqItem[] = [
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
</script>

<template>
  <section
    style="
      flex: 1;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      padding: clamp(40px, 6vw, 64px) clamp(20px, 5vw, 40px) 64px;
      display: flex;
      flex-direction: column;
      gap: 30px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <div style="display: flex; flex-direction: column; gap: 8px">
      <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
        >questions fréquentes</span
      >
      <h1
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(28px, 5vw, 38px);
          color: var(--tx);
        "
      >
        FAQ
      </h1>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <details v-for="item in items" :key="item.question" class="faq-item">
        <summary class="faq-question">{{ item.question }}</summary>
        <p class="faq-answer">{{ item.answer }}</p>
      </details>
    </div>

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>

<style scoped>
.faq-item {
  border: 1px solid var(--bord);
  border-radius: 11px;
  background: var(--surf);
  padding: 4px 18px;
}
.faq-question {
  cursor: pointer;
  list-style: none;
  padding: 14px 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--tx);
}
.faq-question::-webkit-details-marker {
  display: none;
}
.faq-question::before {
  content: "▸";
  display: inline-block;
  margin-right: 10px;
  color: var(--acc);
  transition: transform 0.15s ease;
}
.faq-item[open] .faq-question::before {
  transform: rotate(90deg);
}
.faq-answer {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--tx2);
}
</style>
