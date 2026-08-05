<script setup lang="ts"></script>

<template>
  <div style="flex: 1; display: flex; flex-direction: column; animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1)">
    <section
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: clamp(48px, 9vw, 90px) clamp(20px, 5vw, 40px) clamp(30px, 5vw, 46px);
        text-align: center;
      "
    >
      <span style="font: 400 11px Silkscreen, monospace; color: var(--acc); letter-spacing: 1px"
        >votre bibliothèque steam, triée par votre état du soir</span
      >
      <h1
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(38px, 8vw, 62px);
          line-height: 1.02;
          max-width: 16ch;
          color: var(--tx);
        "
      >
        Ce soir, je joue à<span style="color: var(--acc); animation: blink 1.1s steps(1) infinite">_</span>
      </h1>
      <p
        style="
          margin: 0;
          max-width: 52ch;
          font-size: clamp(16px, 2.2vw, 17.5px);
          line-height: 1.65;
          color: var(--tx2);
        "
      >
        Dites-nous votre humeur, votre fatigue et le temps que vous avez devant vous. On vous rend trois
        jeux — pas trente.
      </p>
      <router-link
        to="/connexion"
        class="landing-cta-btn"
        style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
          padding: 17px 30px;
          border-radius: 11px;
          border: 1px solid var(--acc);
          background: var(--acc);
          color: var(--accink);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 0 4px color-mix(in oklch, var(--acc) 18%, transparent);
          transition: transform 0.15s ease;
        "
      >
        Découvrir mon podium<span style="font: 400 13px Silkscreen, monospace">▶</span>
      </router-link>
    </section>

    <!-- Aperçu du podium : mockup decoratif, pas le vrai composant PodiumCard
         (qui a besoin de vraies suggestions et de liens Steam). -->
    <section
      style="
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: center;
        gap: clamp(10px, 2vw, 18px);
        padding: 0 20px clamp(50px, 8vw, 80px);
      "
      aria-hidden="true"
    >
      <div class="landing-mock-card" style="width: 150px; height: 190px; background: var(--silverbg)">
        <span class="landing-mock-badge">2</span>
        <div class="landing-mock-body">
          <span class="landing-mock-title">Un classique</span>
          <span class="landing-mock-percent" style="color: var(--silver)">78 %</span>
        </div>
      </div>
      <div class="landing-mock-card" style="width: 168px; height: 232px; background: var(--goldbg); transform: translateY(-14px)">
        <span class="landing-mock-badge">1</span>
        <div class="landing-mock-body">
          <span class="landing-mock-title">Votre jeu du soir</span>
          <span class="landing-mock-percent" style="color: var(--gold)">92 %</span>
        </div>
      </div>
      <div class="landing-mock-card" style="width: 150px; height: 170px; background: var(--bronzebg)">
        <span class="landing-mock-badge">3</span>
        <div class="landing-mock-body">
          <span class="landing-mock-title">Une découverte</span>
          <span class="landing-mock-percent" style="color: var(--bronze)">61 %</span>
        </div>
      </div>
    </section>

    <section
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 0 clamp(20px, 5vw, 40px) clamp(50px, 8vw, 80px);
      "
    >
      <h2
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(22px, 4vw, 28px);
          color: var(--tx);
          text-align: center;
        "
      >
        Comment ça marche
      </h2>
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1px;
          width: 100%;
          max-width: 860px;
          background: var(--bord);
          border: 1px solid var(--bord);
          border-radius: 12px;
          overflow: hidden;
        "
      >
        <div class="landing-step">
          <span style="font: 700 11px Silkscreen, monospace; color: var(--acc)">01</span>
          <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Connexion Steam</span>
          <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
            >On lit votre bibliothèque et vos temps de jeu.</span
          >
        </div>
        <div class="landing-step">
          <span style="font: 700 11px Silkscreen, monospace; color: var(--tx3)">02</span>
          <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Votre état du soir</span>
          <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
            >Quatre questions, trente secondes.</span
          >
        </div>
        <div class="landing-step">
          <span style="font: 700 11px Silkscreen, monospace; color: var(--tx3)">03</span>
          <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Votre podium</span>
          <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
            >Trois jeux classés, et le pourquoi.</span
          >
        </div>
      </div>
    </section>

    <section
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: clamp(40px, 7vw, 64px) clamp(20px, 5vw, 40px);
        background: var(--surf);
        border-top: 1px solid var(--bord);
      "
    >
      <h2
        style="
          margin: 0;
          font-family: 'Pixelify Sans', monospace;
          font-weight: 600;
          font-size: clamp(20px, 3.5vw, 24px);
          color: var(--tx);
          text-align: center;
        "
      >
        Rien à installer, rien à donner
      </h2>
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(20px, 4vw, 40px);
          max-width: 780px;
        "
      >
        <div class="landing-trust">
          <span class="landing-trust-glyph">◈</span>
          <span style="font-size: 14px; font-weight: 600; color: var(--tx)">Lecture seule</span>
          <span style="font-size: 13px; line-height: 1.5; color: var(--tx2)"
            >On ne modifie jamais votre compte ou votre bibliothèque Steam.</span
          >
        </div>
        <div class="landing-trust">
          <span class="landing-trust-glyph">◈</span>
          <span style="font-size: 14px; font-weight: 600; color: var(--tx)">Pas de mot de passe</span>
          <span style="font-size: 13px; line-height: 1.5; color: var(--tx2)"
            >La connexion passe entièrement par la page officielle de Steam.</span
          >
        </div>
        <div class="landing-trust">
          <span class="landing-trust-glyph">◈</span>
          <span style="font-size: 14px; font-weight: 600; color: var(--tx)">Données minimales</span>
          <span style="font-size: 13px; line-height: 1.5; color: var(--tx2)"
            >Rien n'est revendu ni partagé. Détails dans les
            <router-link to="/mentions-legales" style="color: var(--acc)">mentions légales</router-link>.</span
          >
        </div>
      </div>
      <router-link
        to="/connexion"
        class="landing-cta-btn landing-cta-btn--ghost"
        style="
          margin-top: 6px;
          padding: 14px 24px;
          border-radius: 11px;
          border: 1px solid var(--bord);
          color: var(--tx2);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
        "
      >
        Se connecter avec Steam
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.landing-cta-btn:hover {
  transform: translateY(-2px);
}
.landing-cta-btn--ghost:hover {
  border-color: var(--acc);
  color: var(--acc);
}
.landing-mock-card {
  position: relative;
  border-radius: 14px;
  padding: 3px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
}
.landing-mock-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font: 700 11px Silkscreen, monospace;
  color: var(--tx);
  background: color-mix(in oklch, var(--surf) 70%, transparent);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.landing-mock-body {
  position: absolute;
  inset: auto 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.landing-mock-title {
  font-family: "Pixelify Sans", monospace;
  font-weight: 600;
  font-size: 13px;
  color: #f6ebe1;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
.landing-mock-percent {
  font: 700 12px Silkscreen, monospace;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
.landing-step {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: flex-start;
  padding: 22px 24px;
  text-align: left;
  background: var(--bg);
}
.landing-trust {
  flex: 1;
  min-width: 190px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.landing-trust-glyph {
  font-size: 16px;
  color: var(--acc);
}
</style>
