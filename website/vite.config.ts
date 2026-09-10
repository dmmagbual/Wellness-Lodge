import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  // @wellness-lodge/shared is linked via npm's file: protocol (not a workspace),
  // so its real path on disk sits outside node_modules. Vite's dev server then
  // serves it as raw source instead of pre-bundling it, and esbuild's on-the-fly
  // transform doesn't reliably do CJS->ESM named-export interop for it -- named
  // imports like `formatPGK` fail with "does not provide an export named...".
  // Forcing it into optimizeDeps makes Vite pre-bundle it properly.
  optimizeDeps: {
    include: ["@wellness-lodge/shared"],
  },
});
