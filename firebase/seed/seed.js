/**
 * Seeds the Firebase EMULATORS ONLY (guarded below) with sample content so
 * the website and front desk app have something real to show in local
 * development and client demos.
 *
 * Every business fact here (room names, rates, bank details, contact info)
 * is a SAMPLE placeholder pending the lodge's completed content checklist
 * (Final Client Submission Package, doc 03). Nothing here should reach a
 * production Firebase project — this script refuses to run unless
 * FIRESTORE_EMULATOR_HOST is set, precisely to prevent that mistake.
 *
 * Run: npm run seed   (from firebase/seed, with emulators already running)
 */
const admin = require("firebase-admin");

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "Refusing to run: FIRESTORE_EMULATOR_HOST is not set.\n" +
      "This script only seeds the local emulator suite. Start it first:\n" +
      "  cd firebase && firebase emulators:start\n" +
      "then in another terminal:\n" +
      "  FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npm --prefix seed run seed"
  );
  process.exit(1);
}

admin.initializeApp({ projectId: "wellness-lodge-demo" });
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
    active: true,
  },
  {
    id: "full-day-wedding",
    name: "Full-Day Wedding & Event Package",
    capacitySeated: 150,
    capacityStanding: 220,
    priceFromToea: toea(4500),
    inclusions: ["Tables, chairs and linen", "PA system", "Event lighting", "Dedicated event coordinator", "Setup and pack-down"],
    images: [],
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
    images: [],
    approved: true,
    sortOrder: 1,
  },
  {
    id: "pe2",
    title: "Sample Corporate Conference",
    category: "Conference",
    eventDate: "2025-11-02",
    description: "PLACEHOLDER — replace with an approved photo and description once the lodge confirms publication permission.",
    images: [],
    approved: true,
    sortOrder: 2,
  },
];

const SETTINGS_PUBLIC = {
  lodgeName: "Wellness Lodge",
  tagline: "Rest. Recharge. Reconnect.",
  phone: "TO BE CONFIRMED",
  reservationsPhone: "TO BE CONFIRMED",
  whatsapp: "TO BE CONFIRMED",
  email: "info@wellnesslodge.example",
  reservationsEmail: "reservations@wellnesslodge.example",
  address: "TO BE CONFIRMED — Papua New Guinea",
  mapUrl: "",
  checkInTime: "14:00",
  checkOutTime: "10:00",
  bankAccountName: "TO BE CONFIRMED",
  bankName: "TO BE CONFIRMED",
  bankBranch: "TO BE CONFIRMED",
  bankAccountNumber: "TO BE CONFIRMED",
  bankSwift: "",
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

async function run() {
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
