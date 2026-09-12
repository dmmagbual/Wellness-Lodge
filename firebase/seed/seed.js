/**
 * Seeds sample content so the website and front desk app have something
 * real to show in local development and client demos.
 *
 * Every business fact here (room names, rates, bank details, contact info)
 * is a SAMPLE placeholder pending the lodge's completed content checklist
 * (Final Client Submission Package, doc 03).
 *
 * TWO MODES, both explicit -- there is no implicit/default target:
 *
 *  1. Emulator (default local dev): start the emulator suite, then
 *       FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npm --prefix seed run seed
 *
 *  2. Real Firebase project (used once, deliberately, to give the client a
 *     working demo before their real content checklist is filled in):
 *       SEED_PRODUCTION=yes PROJECT_ID=wellness-lodge npm --prefix seed run seed -- --confirm=wellness-lodge
 *     Requires:
 *       - gcloud auth application-default login (as an account with access
 *         to that Firebase project) run once beforehand.
 *       - --confirm=<PROJECT_ID> to match PROJECT_ID exactly, so a copy-paste
 *         mistake can't silently target the wrong project.
 *       - The target's roomCategories collection to be empty. If it already
 *         has documents (i.e. this was seeded before, or the client's real
 *         content already went in), the script refuses and prints what it
 *         found -- pass --force to overwrite anyway, but that will clobber
 *         whatever is currently live, sample or real, so only do that
 *         knowingly.
 *     Nothing else (no env var, no missing flag) will make this script touch
 *     a real project -- that is intentional, to prevent ever seeding sample
 *     data over real guest/financial data by accident.
 */
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const confirmArg = args.find((a) => a.startsWith("--confirm="))?.split("=")[1];
const force = args.includes("--force");

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const seedingProduction = process.env.SEED_PRODUCTION === "yes";

let projectId;
if (usingEmulator) {
  projectId = "wellness-lodge-demo";
  admin.initializeApp({ projectId });
} else if (seedingProduction) {
  projectId = process.env.PROJECT_ID;
  if (!projectId) {
    console.error("Refusing to run: SEED_PRODUCTION=yes requires PROJECT_ID to also be set.");
    process.exit(1);
  }
  if (confirmArg !== projectId) {
    console.error(
      `Refusing to run: pass --confirm=${projectId} to explicitly confirm the target project (got ${
        confirmArg ? `--confirm=${confirmArg}` : "no --confirm flag"
      }).`
    );
    process.exit(1);
  }
  console.log(`Seeding REAL Firebase project "${projectId}" with SAMPLE placeholder content.`);
  admin.initializeApp({ projectId, credential: admin.credential.applicationDefault() });
} else {
  console.error(
    "Refusing to run: neither FIRESTORE_EMULATOR_HOST nor SEED_PRODUCTION=yes is set.\n" +
      "For local dev, start the emulator suite first:\n" +
      "  cd firebase && firebase emulators:start\n" +
      "then in another terminal:\n" +
      "  FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npm --prefix seed run seed\n" +
      "To seed a real Firebase project instead, see the comment at the top of this file."
  );
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const toea = (kina) => Math.round(kina * 100);
const now = () => new Date().toISOString();

const CATEGORIES = [
  {
    id: "garden-view-room",
    name: "Garden View Room",
    slug: "garden-view-room",
    description:
      "SAMPLE CONTENT. A comfortable room overlooking the gardens, with a queen bed, ensuite bathroom, ceiling fan and air-conditioning.",
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    bedType: "Queen",
    sizeSqm: 24,
    amenities: ["Queen bed", "Ensuite bathroom", "Air-conditioning", "Free Wi-Fi", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
    ],
    totalRooms: 6,
    active: true,
    sortOrder: 1,
    rate: 35000,
    extraAdult: 5000,
    child: 3000,
  },
  {
    id: "deluxe-room",
    name: "Deluxe Room",
    slug: "deluxe-room",
    description:
      "SAMPLE CONTENT. Extra space and a private balcony. King bed, work desk, and premium amenities.",
    maxAdults: 2,
    maxChildren: 2,
    maxOccupancy: 4,
    bedType: "King",
    sizeSqm: 32,
    amenities: ["King bed", "Private balcony", "Air-conditioning", "Free Wi-Fi", "Mini fridge", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    ],
    totalRooms: 8,
    active: true,
    sortOrder: 2,
    rate: 48000,
    extraAdult: 6000,
    child: 3500,
  },
  {
    id: "rainforest-suite",
    name: "Rainforest Suite",
    slug: "rainforest-suite",
    description:
      "SAMPLE CONTENT. Our most spacious stay — a separate living area, king bed plus a day bed, and a veranda overlooking the rainforest edge of the property.",
    maxAdults: 2,
    maxChildren: 2,
    maxOccupancy: 4,
    bedType: "King + day bed",
    sizeSqm: 45,
    amenities: ["King bed", "Day bed", "Veranda", "Air-conditioning", "Free Wi-Fi", "Mini bar", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    ],
    totalRooms: 4,
    active: true,
    sortOrder: 3,
    rate: 65000,
    extraAdult: 7000,
    child: 4000,
  },
  {
    id: "family-suite",
    name: "Family Suite",
    slug: "family-suite",
    description:
      "SAMPLE CONTENT. Two connecting rooms ideal for families — one king bed and two singles, with a shared living space.",
    maxAdults: 4,
    maxChildren: 3,
    maxOccupancy: 6,
    bedType: "King + 2 singles",
    sizeSqm: 55,
    amenities: ["King bed", "Two single beds", "Air-conditioning", "Free Wi-Fi", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1631844820835-e698dc518bc6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    totalRooms: 3,
    active: true,
    sortOrder: 4,
    rate: 82000,
    extraAdult: 8000,
    child: 4000,
  },
];

const CAR_RENTAL = [
  {
    id: "sedan-standard",
    name: "Standard Sedan",
    category: "Sedan",
    dailyRateToea: toea(280),
    seats: 5,
    transmission: "AUTOMATIC",
    images: ["https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80"],
    inclusions: ["Air-conditioning", "Comprehensive insurance"],
    requirements: ["Valid driving licence", "Minimum age 25", "K1,000 security deposit"],
    active: true,
  },
  {
    id: "suv-4x4",
    name: "4x4 SUV",
    category: "SUV",
    dailyRateToea: toea(480),
    seats: 7,
    transmission: "AUTOMATIC",
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"],
    inclusions: ["Air-conditioning", "Comprehensive insurance", "Roof rack"],
    requirements: ["Valid driving licence", "Minimum age 25", "K2,000 security deposit"],
    active: true,
  },
  {
    id: "van-group",
    name: "10-Seater Van",
    category: "Van",
    dailyRateToea: toea(650),
    seats: 10,
    transmission: "AUTOMATIC",
    images: ["https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1200&q=80"],
    inclusions: ["Air-conditioning", "Comprehensive insurance", "Driver available on request"],
    requirements: ["Valid driving licence", "Minimum age 25", "K2,500 security deposit"],
    active: true,
  },
];

const FUNCTION_HALL = [
  {
    id: "half-day-hire",
    name: "Half-Day Hire",
    capacitySeated: 80,
    capacityStanding: 120,
    priceFromToea: toea(1500),
    inclusions: ["Tables and chairs", "PA system", "Standard lighting", "4-hour hire window"],
    images: ["https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80"],
    active: true,
  },
  {
    id: "full-day-wedding",
    name: "Full-Day Wedding & Event Package",
    capacitySeated: 150,
    capacityStanding: 220,
    priceFromToea: toea(4500),
    inclusions: ["Tables, chairs and linen", "PA system", "Event lighting", "Dedicated event coordinator", "Setup and pack-down"],
    images: ["https://images.unsplash.com/photo-1606217239582-d9f72323bcd7?auto=format&fit=crop&w=1200&q=80"],
    active: true,
  },
];

const MENU = [
  { id: "m1", outlet: "RESTAURANT", category: "Main", name: "Grilled Barramundi", description: "SAMPLE — with seasonal vegetables and rice.", priceToea: toea(65), dietary: [], active: true },
  { id: "m2", outlet: "RESTAURANT", category: "Main", name: "Grilled Chicken", description: "SAMPLE — with garden salad and chips.", priceToea: toea(55), dietary: [], active: true },
  { id: "m3", outlet: "RESTAURANT", category: "Vegetarian", name: "Vegetable Stir Fry", description: "SAMPLE — seasonal vegetables, rice.", priceToea: toea(42), dietary: ["Vegetarian"], active: true },
  { id: "m4", outlet: "CAFE", category: "Beverage", name: "PNG Highlands Coffee", description: "SAMPLE — locally grown, freshly brewed.", priceToea: toea(12), dietary: [], active: true },
  { id: "m5", outlet: "CAFE", category: "Light meal", name: "Club Sandwich", description: "SAMPLE — with chips and salad.", priceToea: toea(28), dietary: [], active: true },
];

const PAST_EVENTS = [
  {
    id: "pe1",
    title: "Sample Garden Wedding",
    category: "Wedding",
    eventDate: "2025-08-14",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1606217239582-d9f72323bcd7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1603214924133-5c2c78471b73?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1621829845053-c8114fc01eb3?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 1,
  },
  {
    id: "pe2",
    title: "Sample Corporate Conference",
    category: "Conference",
    eventDate: "2025-11-02",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1573164574511-73c773193279?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 2,
  },
  {
    id: "pe3",
    title: "Sample Wedding Anniversary",
    category: "Anniversary",
    eventDate: "2025-06-21",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1551963319-13ff32a5acd1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1719499683843-721331f2495f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739578874534-57d5aecd04f4?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 3,
  },
  {
    id: "pe4",
    title: "Sample Birthday Celebration",
    category: "Birthday",
    eventDate: "2025-09-05",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1648090328043-e75292e328ec?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1648090319889-73787d9b3f14?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1656450552703-83ea08a43263?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 4,
  },
  {
    id: "pe5",
    title: "Sample Engagement Celebration",
    category: "Engagement",
    eventDate: "2025-04-12",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1719499719196-7a256956a22b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1718997534125-052b2ff48cd0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1645827042168-4fb0cdd0bf7e?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 5,
  },
  {
    id: "pe6",
    title: "Sample Christening Celebration",
    category: "Christening",
    eventDate: "2025-07-19",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [
      "https://images.unsplash.com/photo-1731743215053-53eb81151f60?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1731743214989-9b4d60937ddf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1731743214318-e259c46f6b2c?auto=format&fit=crop&w=1200&q=80",
    ],
    approved: true,
    sortOrder: 6,
  },
];

const SETTINGS_PUBLIC = {
  // Contact + bank details below are DEMO/PLACEHOLDER values so the site and
  // booking flow look complete for client presentations. The bank is
  // fictional (not a real institution) — replace all of this with the
  // lodge's real details before launch (Final Client Submission Package).
  lodgeName: "Wellness Lodge",
  tagline: "Rest. Recharge. Reconnect.",
  phone: "+675 325 0000",
  reservationsPhone: "+675 325 0001",
  whatsapp: "+675 7000 0000",
  email: "info@wellnesslodge.example",
  reservationsEmail: "reservations@wellnesslodge.example",
  address: "Sample Address, Port Moresby, National Capital District, Papua New Guinea",
  mapUrl: "",
  checkInTime: "14:00",
  checkOutTime: "10:00",
  bankAccountName: "The Wellness Lodge Ltd",
  bankName: "Melanesian Trust Bank (demo)",
  bankBranch: "Port Moresby Branch",
  bankAccountNumber: "7025 4839 01",
  bankSwift: "MTBKPGPM",
  receiptDeadlineHours: 48,
  payAtDeskHoldHours: 12,
  depositPercent: 30,
  gstEnabled: false,
  gstPercent: 10,
  cancellationPolicy:
    "PLACEHOLDER — cancellations made more than 7 days before check-in receive a full refund of the deposit. Cancellations within 7 days forfeit the deposit. Replace with the lodge's approved policy.",
  privacyNotice: "PLACEHOLDER — replace with the lodge's approved privacy notice before launch.",
  socials: {},
};

const DEMO_STAFF = [
  { email: "admin@wellnesslodge.demo", name: "Demo Administrator", role: "ADMINISTRATOR", password: "Demo!Pass123" },
  { email: "manager@wellnesslodge.demo", name: "Demo Manager", role: "MANAGER", password: "Demo!Pass123" },
  { email: "frontdesk@wellnesslodge.demo", name: "Demo Front Desk", role: "FRONT_DESK", password: "Demo!Pass123" },
];

async function preflightGuard() {
  if (!seedingProduction || force) return;
  const existing = await db.collection("roomCategories").limit(5).get();
  if (!existing.empty) {
    console.error(
      `Refusing to run: project "${projectId}" already has ${existing.size >= 5 ? "5+" : existing.size} ` +
        `document(s) in roomCategories (e.g. "${existing.docs[0].id}"). This script will not overwrite ` +
        "existing catalogue data -- sample or the client's real content -- without --force.\n" +
        "Pass --force only if you are certain you want to overwrite what's currently live."
    );
    process.exit(1);
  }
}

async function run() {
  await preflightGuard();

  console.log("Seeding room categories, rates and rooms...");
  for (const c of CATEGORIES) {
    const { rate, extraAdult, child, ...category } = c;
    await db.collection("roomCategories").doc(c.id).set(category);
    await db
      .collection("ratePeriods")
      .doc(`${c.id}-standard`)
      .set({
        id: `${c.id}-standard`,
        categoryId: c.id,
        label: "Standard rate",
        startDate: "2026-01-01",
        endDate: "2027-12-31",
        nightlyRateToea: rate,
        extraAdultToea: extraAdult,
        childRateToea: child,
        minStayNights: 1,
        active: true,
      });
    for (let i = 1; i <= c.totalRooms; i++) {
      const roomId = `${c.id}-${String(i).padStart(2, "0")}`;
      await db.collection("rooms").doc(roomId).set({
        id: roomId,
        categoryId: c.id,
        code: `${c.name.split(" ").map((w) => w[0]).join("").toUpperCase()}-${i}`,
        active: true,
      });
    }
  }

  console.log("Seeding car rental fleet...");
  for (const v of CAR_RENTAL) await db.collection("carRentalVehicles").doc(v.id).set(v);

  console.log("Seeding function hall packages...");
  for (const p of FUNCTION_HALL) await db.collection("functionHallPackages").doc(p.id).set(p);

  console.log("Seeding restaurant & cafe menu...");
  for (const m of MENU) await db.collection("menuItems").doc(m.id).set(m);

  console.log("Seeding past events gallery...");
  for (const e of PAST_EVENTS) await db.collection("pastEvents").doc(e.id).set(e);

  console.log("Seeding public settings...");
  await db.collection("settings").doc("public").set(SETTINGS_PUBLIC);

  console.log("Seeding demo staff accounts...");
  for (const s of DEMO_STAFF) {
    let uid;
    try {
      const rec = await auth.createUser({ email: s.email, password: s.password, displayName: s.name });
      uid = rec.uid;
    } catch (e) {
      const rec = await auth.getUserByEmail(s.email);
      uid = rec.uid;
    }
    await db.collection("users").doc(uid).set({
      uid,
      name: s.name,
      email: s.email,
      role: s.role,
      active: true,
      createdAt: now(),
      deactivatedAt: null,
    });
    console.log(`  ${s.role.padEnd(14)} ${s.email}  (password: ${s.password})`);
  }

  console.log("\nSeed complete. All content above is SAMPLE / placeholder — see");
  console.log("docs/CONTENT_CHECKLIST_STATUS.md for what the lodge must supply before launch.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
