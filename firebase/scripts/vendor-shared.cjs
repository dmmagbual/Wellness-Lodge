#!/usr/bin/env node
/**
 * Builds @wellness-lodge/shared and vendors it into firebase/functions/vendor/
 * as a local npm tarball, then points functions/package.json's dependency at
 * that tarball instead of `file:../../shared`.
 *
 * Why this exists: Cloud Functions deploy only uploads the functions/
 * directory to Cloud Build -- sibling folders like ../../shared never reach
 * that isolated environment. A `file:../../shared` dependency resolves fine
 * locally (npm just follows the path) but Cloud Build's `npm ci` fails
 * outright because the referenced path doesn't exist inside the uploaded
 * package. Vendoring a tarball INSIDE functions/ keeps the whole dependency
 * chain within the uploaded tree, so `npm ci` can resolve it anywhere.
 *
 * Run as the first step of firebase.json's functions predeploy, before the
 * TypeScript build.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const firebaseDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(firebaseDir, "..");
const sharedDir = path.join(repoRoot, "shared");
const functionsDir = path.join(firebaseDir, "functions");
const vendorDir = path.join(functionsDir, "vendor");

function run(cmd, cwd) {
  console.log(`[vendor-shared] $ ${cmd}  (in ${cwd})`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

console.log("[vendor-shared] Building @wellness-lodge/shared...");
run("npm install --include=dev", sharedDir);
run("npm run build", sharedDir);

fs.mkdirSync(vendorDir, { recursive: true });
for (const f of fs.readdirSync(vendorDir)) {
  if (f.endsWith(".tgz")) fs.unlinkSync(path.join(vendorDir, f));
}

console.log("[vendor-shared] Packing shared into functions/vendor/...");
const packOutput = execSync(`npm pack "${sharedDir}" --pack-destination "${vendorDir}"`, {
  cwd: functionsDir,
  encoding: "utf8",
}).trim();
const lines = packOutput.split("\n").map((l) => l.trim()).filter(Boolean);
const tarballName = lines[lines.length - 1];
console.log(`[vendor-shared] Packed ${tarballName}`);

const pkgPath = path.join(functionsDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const newSpec = `file:vendor/${tarballName}`;
if (pkg.dependencies["@wellness-lodge/shared"] !== newSpec) {
  pkg.dependencies["@wellness-lodge/shared"] = newSpec;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`[vendor-shared] Updated functions/package.json dependency -> ${newSpec}`);
}

console.log("[vendor-shared] Reinstalling functions dependencies against the vendored tarball...");
run("npm install --include=dev", functionsDir);

console.log("[vendor-shared] Done.");
