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

// npm's dependency resolution for a local `file:` tarball dependency is not
// reliable here: its resolved spec string never changes (same version, same
// tarball filename every run, since this package's version never bumps), and
// depending on npm's own package-lock/content cache it can decide "nothing
// to do" and silently keep a PREVIOUS extraction or cached resolution even
// after node_modules/@wellness-lodge/shared is deleted and this run just
// packed genuinely new content into the tarball. That has caused several
// real bugs this session -- functions compiled and deployed successfully
// against a stale copy of shared's types while shared/src had already moved
// on, and it wasn't obvious until something broke in production.
const vendoredModuleDir = path.join(functionsDir, "node_modules", "@wellness-lodge", "shared");
if (fs.existsSync(vendoredModuleDir)) {
  console.log("[vendor-shared] Removing previously-extracted @wellness-lodge/shared...");
  fs.rmSync(vendoredModuleDir, { recursive: true, force: true });
}

// functions/package-lock.json is NOT in firebase.json's functions ignore list,
// so it gets uploaded to Cloud Build right alongside the vendor tarball, and
// Cloud Build's own npm install verifies the tarball's real bytes against the
// sha512 integrity hash recorded in that lockfile. Because this tarball's
// filename/version never changes, a plain local `npm install` does not
// reliably rewrite that recorded hash when we repack genuinely new content
// into it -- so a deploy can carry a lockfile still promising an OLDER
// build's hash. Locally this is invisible (nothing here re-verifies it), but
// Cloud Build enforces it strictly and fails the whole functions build with
// EINTEGRITY. Deleting the lockfile here forces npm to regenerate it from
// scratch against whatever tarball was *just* packed above, every run --
// exactly the same "no stale cache layer survives" guarantee already applied
// to node_modules/@wellness-lodge/shared below.
const lockfilePath = path.join(functionsDir, "package-lock.json");
if (fs.existsSync(lockfilePath)) {
  console.log("[vendor-shared] Deleting functions/package-lock.json to force a fresh integrity hash...");
  fs.rmSync(lockfilePath, { force: true });
}

console.log("[vendor-shared] Reinstalling functions dependencies (external packages)...");
run("npm install --include=dev", functionsDir);

// Belt-and-suspenders: rather than trust npm to have correctly re-resolved
// OUR OWN package from the point above, extract the tarball we just packed
// directly on top of node_modules/@wellness-lodge/shared ourselves. This
// bypasses npm's caching entirely for this one internal package, so what
// ends up in node_modules is always, unconditionally, exactly what's in the
// tarball we just built -- no cache layer left that can serve something else.
const tarballPath = path.join(vendorDir, tarballName);
fs.rmSync(vendoredModuleDir, { recursive: true, force: true });
fs.mkdirSync(vendoredModuleDir, { recursive: true });
run(`tar -xzf "${tarballPath}" -C "${vendoredModuleDir}" --strip-components=1`, functionsDir);
console.log(`[vendor-shared] Force-extracted ${tarballName} directly into node_modules/@wellness-lodge/shared.`);

console.log("[vendor-shared] Done.");
