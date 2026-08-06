import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// En dev, `vercel dev` sert les fonctions api/ sur le port 3000 ;
// ce proxy évite les soucis de cookies/CORS entre les deux serveurs.
export default defineConfig({
  plugins: [vue()],
  // Le repo centralise toutes les variables d'env dans le .env a la racine
  // du monorepo (voir .env.example) ; sans ca, Vite ne chargerait que
  // front/.env, qui n'existe pas.
  envDir: "..",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
