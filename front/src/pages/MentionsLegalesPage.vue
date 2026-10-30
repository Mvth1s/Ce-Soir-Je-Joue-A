<script setup lang="ts">
import { useCookieConsent } from "@/composables/useCookieConsent";

const { resetChoice } = useCookieConsent();
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
        Ce site est édité par <strong style="color: var(--tx)">Mvth1s</strong>, à titre personnel et non
        professionnel. Conformément à l'article 1-1, II de la loi n° 2004-575 du 21 juin 2004 (LCEN),
        l'éditeur a choisi de conserver l'anonymat. Ses éléments d'identification ont été communiqués à
        l'hébergeur. Le site ne vend rien, n'affiche aucune publicité et ne génère aucun revenu. Contact :
        <a href="mailto:mag.d3v+cesoirjejouea@pm.me" style="color: var(--acc)">mag.d3v+cesoirjejouea@pm.me</a>.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Hébergement</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.
        Contact :
        <a href="mailto:privacy@vercel.com" style="color: var(--acc)">privacy@vercel.com</a> (téléphone non
        communiqué par l'hébergeur). Vercel est certifié EU-U.S. Data Privacy Framework.
        La base de données est hébergée par Neon : Databricks, Inc. (maison mère de Neon, LLC), 160 Spear
        Street, 15th Floor, San Francisco, CA 94105, États-Unis, sur l'infrastructure Amazon Web Services
        de la région eu-west-2 (Londres, Royaume-Uni).
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
        La connexion se fait uniquement via Steam (OpenID) : votre mot de passe Steam est saisi sur le site de
        Steam, jamais sur celui-ci, et aucun mot de passe n'est collecté, créé ni stocké ici. Un identifiant
        interne est généré pour chaque compte ; le SteamID64 lui est rattaché comme simple liaison de
        plateforme. La bibliothèque Steam (liste des jeux, temps joué, date de dernière session) est mise en
        cache pour éviter des appels répétés à Steam. Les critères choisis et les suggestions obtenues ne sont
        pas enregistrés. Aucune donnée n'est cédée, vendue ou utilisée à des fins publicitaires.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Services tiers appelés</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Votre navigateur ne contacte jamais directement ces services : c'est le serveur du site qui les
        interroge.
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        <li>
          <strong style="color: var(--tx)">Steam</strong> (Valve Corporation, États-Unis) : authentification
          OpenID, puis lecture de votre bibliothèque de jeux à partir de votre SteamID64. Votre profil Steam
          doit rendre ses jeux visibles pour que cette lecture fonctionne.
        </li>
        <li>
          <strong style="color: var(--tx)">Mistral AI</strong> (France) : reçoit une sélection de jeux de
          votre bibliothèque (titre, temps joué, dernière session) et les critères choisis, afin de proposer
          trois suggestions. Aucun identifiant (SteamID64, identifiant interne) ne lui est transmis.
        </li>
        <li>
          <strong style="color: var(--tx)">SteamGridDB</strong> : reçoit uniquement l'identifiant Steam des
          jeux suggérés, pour récupérer leur affiche. Aucune donnée vous concernant ne lui est transmise.
        </li>
      </ul>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Transferts hors de l'Union européenne</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Certaines données peuvent être traitées hors de l'Union européenne : par Vercel Inc. (hébergement,
        États-Unis), par Valve Corporation lors des appels à Steam (États-Unis) et, si vous l'acceptez, par
        Google pour la mesure d'audience (voir « Cookies » ci-dessous). TODO : préciser la région
        d'hébergement de la base Neon et des fonctions Vercel.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Durées de conservation</h2>
      <ul style="margin: 0; padding-left: 20px; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        <li>Cookie de session : 14 jours au maximum, ou jusqu'à la déconnexion.</li>
        <li>
          Bibliothèque Steam en cache : rafraîchie depuis Steam lorsqu'elle date de plus de 4 heures, et
          supprimée avec le compte.
        </li>
        <li>
          Identifiant interne et SteamID64 : conservés jusqu'à suppression sur demande (voir « Vos droits et
          suppression des données » ci-dessous).
        </li>
        <li>
          Choix relatif aux cookies : conservé dans le stockage local de votre navigateur jusqu'à ce que vous
          le modifiiez ou effaciez les données du site.
        </li>
        <li>
          Données Google Analytics : conservées 2 mois.
        </li>
      </ul>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Vos droits et suppression des données</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Conformément au RGPD, vous pouvez demander l'accès à vos données, leur rectification, leur effacement,
        leur portabilité, ou vous opposer à leur traitement. Pour supprimer votre compte (identifiant interne,
        SteamID64 et bibliothèque en cache), écrivez à
        <a href="mailto:mag.d3v+cesoirjejouea@pm.me" style="color: var(--acc)">mag.d3v+cesoirjejouea@pm.me</a> depuis
        n'importe quelle adresse en indiquant votre profil Steam ; aucune demande n'a besoin d'être publiée
        publiquement. Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une
        réclamation à la
        <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener" style="color: var(--acc)"
          >CNIL</a
        >.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--tx)">Cookies</h2>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Un unique cookie de session, technique et nécessaire au fonctionnement du site (rester connecté), est
        déposé après connexion ; il ne nécessite pas de consentement.
      </p>
      <p style="margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--tx2)">
        Avec votre accord uniquement (bandeau proposé à votre première visite), Google Analytics 4 dépose des
        cookies de mesure d'audience pour comprendre la fréquentation du site (pages visitées, provenance),
        avec anonymisation de l'adresse IP. Tant que vous n'avez pas accepté, le script Google Analytics n'est
        pas chargé. Le bandeau propose « Refuser » et « Accepter » côte à côte, avec la même facilité. Ces
        données sont traitées par Google Ireland Limited et peuvent transiter hors de l'Union européenne ;
        voir la
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener"
          style="color: var(--acc)"
          >politique de confidentialité de Google</a
        >. Aucun cookie publicitaire n'est utilisé, et vous pouvez retirer ou modifier votre choix à tout
        moment, depuis le pied de page ou ici :
        <button
          type="button"
          style="
            display: inline;
            padding: 0;
            border: none;
            background: none;
            font: inherit;
            color: var(--acc);
            text-decoration: underline;
            cursor: pointer;
          "
          @click="resetChoice"
        >
          gérer mes cookies
        </button>.
      </p>
    </div>

    <router-link to="/" style="align-self: flex-start; font-size: 13px; color: var(--tx3); margin-top: 8px"
      >‹ retour à l'accueil</router-link
    >
  </section>
</template>
