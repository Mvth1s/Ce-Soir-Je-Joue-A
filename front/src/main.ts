import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router";
// Polices auto-hebergees (aucun appel a Google Fonts) : uniquement les
// graisses reellement utilisees dans les composants. Chaque fichier declare
// font-display: swap et decoupe par unicode-range, le navigateur ne telecharge
// donc que les sous-ensembles (latin, latin-ext...) necessaires a la page.
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/pixelify-sans/600.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@/styles/tokens.css";

createApp(App).use(router).mount("#app");
