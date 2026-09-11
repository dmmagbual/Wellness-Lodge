#!/usr/bin/env node
/**
 * Copies the built website (../website/dist) into firebase/hosting-dist/
 * before deploying Hosting.
 *
 * Why this exists: firebase-tools refuses a hosting "public" directory that
 * resolves outside the folder containing firebase.json (the same kind of
 * containment rule that broke the functions/../../shared dependency -- see
 * vendor-shared.cjs). Pointing "public" straight at "../website/dist" fails
 * with "is outside of project directory", so the built site has to be
 * copied inside firebase/ first.
 *
 * Run as the hosting predeploy step, after the website has been built.
 */
const fs = require("node:fs");
const path = require("node:path");

const firebaseDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(firebaseDir, "../website/dist");
const destDir = path.join(firebaseDir, "hosting-dist");

if (!fs.existsSync(srcDir)) {
  console.error(`[copy-hosting] ${srcDir} does not exist -- run "npm run build" in website/ first.`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(srcDir, destDir, { recursive: true });
console.log(`[copy-hosting] Copied ${srcDir} -> ${destDir}`);
