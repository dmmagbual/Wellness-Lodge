import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Electron loads the built renderer via file://, so asset URLs must be
// relative ("./") rather than absolute ("/").
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 5174,
  },
  // See website/vite.config.ts for why this is needed: @wellness-lodge/shared
  // is a file:-linked package whose real path is outside node_modules, so
  // Vite must be told to pre-bundle it or named imports fail at dev time.
  optimizeDeps: {
    include: ["@wellness-lodge/shared"],
  },
});
