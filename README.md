# Wellness Lodge — Website, Reservation System & Front Desk App

Built for **Wellness Lodge** (hotel, car rental, function hall) by **4J Innovation Limited**, against the architecture in `Final Client Submission Package/02 - Wellness Lodge Website and Reservation Architecture.txt`.

Three deliverables, one shared codebase:

| Folder | What it is | Runs on |
|---|---|---|
| `website/` | Public marketing site + guest booking engine (rooms, car rental, function hall, restaurant, past events, booking wizard, booking lookup) | Firebase Hosting (any browser) |
| `firebase/` | Firestore database, security rules, and Cloud Functions (availability, booking, payment verification, hold expiry, staff admin) | Firebase (Google Cloud) |
| `electron/` | Front desk & administration app — live booking queue, payment/receipt verification, calendar, staff/rates/audit-log admin | **Installs as a genuine Windows desktop app** (also builds a Linux AppImage) |
| `shared/` | Domain types, money (integer toea, never floats), date and pricing logic used by all three | n/a — a library the others depend on |

All prices are in **Papua New Guinea Kina (PGK)**, stored as integer *toea* (1 Kina = 100 toea) everywhere — never floating-point — per the accounting-integrity requirement for this build.

## ⚠️ Everything here is SAMPLE content

`Final Client Submission Package/03 - Client information and content checklist.docx` — the document meant to supply real room names, rates, bank details, policies, contacts, photos — **is an unfilled template**. Nothing in it has been completed by lodge management yet. So every room, rate, vehicle, package, menu item, past event, bank account and contact detail in this build is clearly-marked placeholder content, seeded by `firebase/seed/seed.js`, meant to demo convincingly while real content is pending.

See **`docs/CONTENT_CHECKLIST_STATUS.md`** for exactly what's still needed from the lodge before this can go live, and **`docs/DEMO_ACCOUNTS.md`** for the three demo staff logins.

---

## 1. Prerequisites

- Node.js 20 or later (built and tested with Node 22)
- A Google account, to create the real Firebase project when you're ready to go live
- Windows, to *run* the installer built by `electron/`. It cross-compiles fine from Linux/Mac using Wine (see §5), but the resulting `.exe` only runs on Windows.

## 2. First-time setup

```bash
# from the repo root
cd shared && npm install && npm run build && cd ..
cd firebase/functions && npm install && npm run build && cd ../..
cd firebase/seed && npm install && cd ../..
cd website && npm install && cd ..
cd electron && npm install && cd ..   # this also installs electron/renderer via postinstall
```

`shared` is consumed by the other three via npm's `file:` protocol (not workspaces), so **rebuild `shared` first** whenever you change its `src/` — the others read its compiled `dist/`, not its TypeScript source.

## 3. Local development (Firebase emulators)

This is how to run the whole system on your own machine with no real Firebase project, no real money, and no real guest data — the recommended way to develop and demo.

```bash
cd firebase
firebase emulators:start
```

This starts Firestore, Auth, Storage, Functions and the emulator UI (`http://localhost:4000`) together, using the ports in `firebase/firebase.json` (Firestore 8080, Auth 9099, Storage 9199, Functions 5001, Hosting 5000, UI 4000).

> **Note on this build:** the sandboxed environment this project was built in blocks outbound access to `storage.googleapis.com`, which is where the Firestore emulator's `.jar` is downloaded from on first run — so live emulator + end-to-end testing could not be executed here (confirmed via a direct failed download, not assumed). **Run `firebase emulators:start` on your own machine first** — it will download that jar once and cache it, then this all works normally. The pure business logic (pricing, dates, money, booking-ref generation) *was* verified here — see §6.

With the emulators running, in a second terminal, seed sample content:

```bash
cd firebase/seed
FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npm run seed
```

`seed.js` refuses to run against anything but an emulator (it checks `FIRESTORE_EMULATOR_HOST` before writing a single document) — this is a deliberate guard so sample content can never accidentally land in a production project. It creates the room categories, car rental fleet, function hall packages, menu, past events, public settings, and the three demo staff logins in `docs/DEMO_ACCOUNTS.md`.

In a third terminal, run the website against the emulators:

```bash
cd website
npm run dev
```

`website/.env.local` already points its Firebase SDK at the emulator hosts — see `website/.env.example` for what each variable does if you need to change ports.

## 4. Front desk app — development mode

```bash
cd electron
npm run start
```

This builds the renderer and launches Electron pointed at whatever Firebase project `electron/renderer/.env.local` names (defaults to the emulators, matching the website). Sign in with one of the demo accounts from `docs/DEMO_ACCOUNTS.md`.

## 5. Building the Windows installer

```bash
cd electron
npm run dist:win
```

This produces `electron/release/WellnessLodgeFrontDesk-Setup-<version>.exe` — a real NSIS Windows installer (not just a packaged web app): it installs into Program Files, creates Start Menu and desktop shortcuts, and the installed app can show native Windows notifications even when the window isn't focused, which is how it satisfies the architecture doc's requirement that front desk staff never miss a new booking or receipt.

Building a Windows target from Linux/Mac requires Wine (cross-compilation only — the output itself needs no Wine to run):

```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install --reinstall wine wine64 wine32:i386
```

electron-builder's icon-embedding tool (`rcedit`) is a 32-bit Windows binary, so both the 64-bit and 32-bit Wine support are needed — 64-bit alone fails with "wine: could not exec the wine loader" when it hits that step.

`npm run dist:linux` builds an AppImage instead, useful for quickly sanity-checking the renderer without a Windows machine at hand.

## 6. Tests

```bash
cd shared
npm test
```

Runs Node's built-in test runner against the pricing/dates/money engine — 17 tests covering rate-period selection (including overlapping periods), nightly summation, extra-adult/child charges, GST, deposit/balance split, zero-length and unrated stays, and booking-reference uniqueness. This is pure-logic coverage; it does not exercise Firestore itself (blocked here per the emulator note in §3 — run the emulator suite on an unrestricted machine for full end-to-end verification of the booking lifecycle, holds, and expiry).

Every `runTransaction` in `firebase/functions/src` was also manually reviewed against Firestore's hard rule that all reads in a transaction must precede all writes — this caught one real bug (`acceptPayAtDesk` was reading the lodge's hold-duration setting *after* it had already written the inventory hold; fixed by moving that read to the top of the transaction, alongside the booking and room-category reads).

## 7. Going live — creating the real Firebase project

1. In the [Firebase console](https://console.firebase.google.com), create a new project.
2. Enable **Firestore** (production mode), **Authentication** (Email/Password provider), **Storage**, and **Cloud Functions** (requires the Blaze pay-as-you-go plan — Functions cannot run on the free Spark plan).
3. `firebase login`, then from `firebase/` run `firebase use --add` and select the new project (replaces the `wellness-lodge-demo` alias in `.firebaserc`).
4. Deploy rules, indexes and functions:
   ```bash
   cd firebase
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules,functions
   ```
5. Build and deploy the website:
   ```bash
   cd website && npm run build && cd ../firebase
   firebase deploy --only hosting
   ```
6. Point `website/.env.local` and `electron/renderer/.env.local` at the real project's Firebase config (from Project Settings → General → Your apps) instead of the emulator hosts, then rebuild both.

### Creating the first real admin

Never seed a production project. Instead:

1. Set the one-time setup code as a Functions config value (or `BOOTSTRAP_SETUP_CODE` env var), then deploy functions.
2. Sign up (or sign in) as the intended administrator in the website or front desk app's auth flow.
3. Call the `bootstrapFirstAdmin` callable once with that setup code and your name — it only works while zero administrators exist, then it's permanently inert. Every account after that is created by an existing administrator via **Staff → Create staff user** in the front desk app.

## 8. Architecture notes for whoever picks this up next

- **Booking never double-books.** Every room-category/night has one inventory counter document (`inventory/{categoryId}/nights/{date}`) tracking `held` vs `booked` counts, checked and incremented atomically inside a single Firestore transaction. Bank-transfer bookings hold nothing until a staff member verifies the receipt; pay-at-desk bookings lock inventory the moment front desk accepts the request, for 12 hours, auto-released by a scheduled function if not confirmed in time.
- **A confirmed booking's price never silently changes.** `computePriceSnapshot()` freezes the rate breakdown onto the booking at creation time, so a later rate-card change never rewrites a guest's already-agreed price.
- **Money is always an integer number of toea.** See `shared/src/money.ts` — no `Booking`, `PriceSnapshot`, `RatePeriod` or Firestore write anywhere uses a float for currency.
- **Every state-changing staff action is audited** (`writeAudit`/`writeAuditNow` → the `auditLog` collection), visible in the front desk app's Audit Log view — required by the architecture doc's "overrides require a reason and remain visible in the audit history."
