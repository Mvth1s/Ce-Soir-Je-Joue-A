<script setup lang="ts"></script>

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
      gap: 34px;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
    "
  >
    <div style="display: flex; flex-direction: column; gap: 8px">
      <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
        >informations légales</span
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
        Mentions légales
      </h1>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Éditeur du site</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        "Ce soir je joue à…" est un projet personnel édité par <strong style="color: var(--tx)">Mvth1s</strong>.
        Contact :
        <a href="mailto:mag.d3v+github@pm.me" style="color: var(--acc)">mag.d3v+github@pm.me</a>.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Hébergement</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Le site est hébergé par Vercel Inc. Coordonnées complètes de l'hébergeur disponibles sur
        <a href="https://vercel.com/legal" target="_blank" rel="noopener" style="color: var(--acc)"
          >vercel.com/legal</a
        >.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Code source</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Le code du site est public et consultable sur
        <a
          href="https://github.com/Mvth1s/Ce-Soir-Je-Joue-A"
          target="_blank"
          rel="noopener"
          style="color: var(--acc)"
          >github.com/Mvth1s/Ce-Soir-Je-Joue-A</a
        >, sous licence
        <a
          href="https://github.com/Mvth1s/Ce-Soir-Je-Joue-A/blob/main/LICENSE"
          target="_blank"
          rel="noopener"
          style="color: var(--acc)"
          >GNU GPL v3</a
        >.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Données personnelles</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        La connexion se fait uniquement via Steam (OpenID) : aucun mot de passe n'est créé ni stocké sur ce
        site. Un identifiant interne est généré pour chaque compte ; le SteamID64 lui est rattaché comme
        simple liaison de plateforme. La bibliothèque Steam (jeux, temps joué, dernière session) est mise en
        cache temporairement pour éviter des appels répétés à Steam. Aucune donnée n'est cédée, vendue ou
        utilisée à des fins publicitaires. Pour toute question ou demande de suppression de vos données,
        écrivez à
        <a href="mailto:mag.d3v+github@pm.me" style="color: var(--acc)">mag.d3v+github@pm.me</a>.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Cookies</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Un unique cookie de session, technique et nécessaire au fonctionnement du site (rester connecté), est
        déposé après connexion. Aucun cookie de mesure d'audience ou de publicité tiers n'est utilisé.
      </p>
    </div>

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>
