<script setup lang="ts"></script>

<template>
  <section
    style="
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 26px;
      padding: clamp(48px, 9vw, 90px) clamp(20px, 5vw, 40px);
      text-align: center;
      animation: pagein 0.45s cubic-bezier(0.2, 0.7, 0.3, 1);
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
    <div
      style="
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1px;
        margin-top: 44px;
        width: 100%;
        max-width: 860px;
        background: var(--bord);
        border: 1px solid var(--bord);
        border-radius: 12px;
        overflow: hidden;
      "
    >
      <div
        style="
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-start;
          padding: 22px 24px;
          text-align: left;
          background: var(--bg);
        "
      >
        <span style="font: 700 11px Silkscreen, monospace; color: var(--acc)">01</span>
        <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Connexion Steam</span>
        <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
          >On lit votre bibliothèque et vos temps de jeu.</span
        >
      </div>
      <div
        style="
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-start;
          padding: 22px 24px;
          text-align: left;
          background: var(--bg);
        "
      >
        <span style="font: 700 11px Silkscreen, monospace; color: var(--tx3)">02</span>
        <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Votre état du soir</span>
        <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
          >Quatre questions, trente secondes.</span
        >
      </div>
      <div
        style="
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-start;
          padding: 22px 24px;
          text-align: left;
          background: var(--bg);
        "
      >
        <span style="font: 700 11px Silkscreen, monospace; color: var(--tx3)">03</span>
        <span style="font-size: 15px; font-weight: 600; color: var(--tx)">Votre podium</span>
        <span style="font-size: 13.5px; line-height: 1.5; color: var(--tx2)"
          >Trois jeux classés, et le pourquoi.</span
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-cta-btn:hover {
  transform: translateY(-2px);
}
</style>
