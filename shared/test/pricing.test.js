const test = require("node:test");
const assert = require("node:assert/strict");
const { computePriceSnapshot, findRateForNight, generateBookingRef, NoRateForNightError } = require("../dist/pricing");
const { nightsBetween, nightCount, isValidDateStr } = require("../dist/dates");
const { formatPGK, kinaToToea, toeaToKina, addToea } = require("../dist/money");

// ---------------------------------------------------------------------------
// dates
// ---------------------------------------------------------------------------

test("nightsBetween enumerates each calendar night, excluding checkout", () => {
  assert.deepEqual(nightsBetween("2026-06-01", "2026-06-04"), ["2026-06-01", "2026-06-02", "2026-06-03"]);
});

test("nightsBetween is empty for same-day check-in/out", () => {
  assert.deepEqual(nightsBetween("2026-06-01", "2026-06-01"), []);
});

test("nightCount matches nightsBetween length", () => {
  assert.equal(nightCount("2026-01-01", "2026-01-10"), 9);
});

test("isValidDateStr rejects malformed and non-existent dates", () => {
  assert.equal(isValidDateStr("2026-06-01"), true);
  assert.equal(isValidDateStr("2026-13-40"), false);
  assert.equal(isValidDateStr("not-a-date"), false);
});

// ---------------------------------------------------------------------------
// money
// ---------------------------------------------------------------------------

test("kinaToToea / toeaToKina round-trip without float drift", () => {
  assert.equal(kinaToToea(350), 35000);
  assert.equal(kinaToToea(19.99), 1999);
  assert.equal(toeaToKina(35000), 350);
});

test("formatPGK renders two decimal places with the K prefix", () => {
  assert.equal(formatPGK(35000), "K350.00");
  assert.equal(formatPGK(1), "K0.01");
});

test("addToea sums and rounds every argument", () => {
  assert.equal(addToea(100, 200.4, 300.6), 601);
});

// ---------------------------------------------------------------------------
// pricing engine
// ---------------------------------------------------------------------------

const STANDARD_RATE = {
  id: "r1",
  categoryId: "cat1",
  label: "Standard",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  nightlyRateToea: 35000,
  extraAdultToea: 5000,
  childRateToea: 3000,
  minStayNights: 1,
  active: true,
};

test("findRateForNight returns the covering period", () => {
  const r = findRateForNight("2026-06-15", "cat1", [STANDARD_RATE]);
  assert.equal(r.id, "r1");
});

test("findRateForNight throws NoRateForNightError when nothing covers the date", () => {
  assert.throws(() => findRateForNight("2027-01-01", "cat1", [STANDARD_RATE]), NoRateForNightError);
});

test("findRateForNight prefers the shorter (more specific) period on overlap", () => {
  const peak = {
    ...STANDARD_RATE,
    id: "r2",
    label: "Peak",
    startDate: "2026-12-20",
    endDate: "2026-12-27",
    nightlyRateToea: 60000,
  };
  const r = findRateForNight("2026-12-24", "cat1", [STANDARD_RATE, peak]);
  assert.equal(r.id, "r2", "the narrower peak-season period should win over the year-long standard rate");
});

test("computePriceSnapshot sums nightly rates correctly for a simple 3-night stay", () => {
  const snap = computePriceSnapshot({
    categoryId: "cat1",
    categoryName: "Garden View Room",
    checkIn: "2026-06-01",
    checkOut: "2026-06-04",
    adults: 2,
    children: 0,
    baseOccupancy: 2,
    ratePeriods: [STANDARD_RATE],
    gstEnabled: false,
    gstPercent: 10,
    depositPercent: 30,
  });
  assert.equal(snap.nights.length, 3);
  assert.equal(snap.subtotalToea, 3 * 35000);
  assert.equal(snap.extraAdultChargeToea, 0);
  assert.equal(snap.childChargeToea, 0);
  assert.equal(snap.gstToea, 0);
  assert.equal(snap.totalToea, 105000);
  assert.equal(snap.depositToea, Math.round(105000 * 0.3));
  assert.equal(snap.balanceToea, snap.totalToea - snap.depositToea);
});

test("computePriceSnapshot applies extra-adult and child charges per night", () => {
  const snap = computePriceSnapshot({
    categoryId: "cat1",
    categoryName: "Garden View Room",
    checkIn: "2026-06-01",
    checkOut: "2026-06-03", // 2 nights
    adults: 3, // 1 extra over baseOccupancy=2
    children: 1,
    baseOccupancy: 2,
    ratePeriods: [STANDARD_RATE],
    gstEnabled: false,
    gstPercent: 10,
    depositPercent: 30,
  });
  assert.equal(snap.extraAdultChargeToea, 1 * 5000 * 2); // 1 extra adult x rate x 2 nights
  assert.equal(snap.childChargeToea, 1 * 3000 * 2);
  assert.equal(snap.subtotalToea, 2 * 35000 + snap.extraAdultChargeToea + snap.childChargeToea);
});

test("computePriceSnapshot applies GST on top of the subtotal when enabled", () => {
  const snap = computePriceSnapshot({
    categoryId: "cat1",
    categoryName: "Garden View Room",
    checkIn: "2026-06-01",
    checkOut: "2026-06-02",
    adults: 2,
    children: 0,
    baseOccupancy: 2,
    ratePeriods: [STANDARD_RATE],
    gstEnabled: true,
    gstPercent: 10,
    depositPercent: 30,
  });
  assert.equal(snap.subtotalToea, 35000);
  assert.equal(snap.gstToea, 3500);
  assert.equal(snap.totalToea, 38500);
});

test("computePriceSnapshot rejects a zero-night stay", () => {
  assert.throws(() =>
    computePriceSnapshot({
      categoryId: "cat1",
      categoryName: "x",
      checkIn: "2026-06-01",
      checkOut: "2026-06-01",
      adults: 1,
      children: 0,
      baseOccupancy: 2,
      ratePeriods: [STANDARD_RATE],
      gstEnabled: false,
      gstPercent: 10,
      depositPercent: 30,
    })
  );
});

test("computePriceSnapshot throws if any night in the stay has no active rate", () => {
  assert.throws(() =>
    computePriceSnapshot({
      categoryId: "cat1",
      categoryName: "x",
      checkIn: "2026-12-29", // outside STANDARD_RATE's Dec 31 boundary edge case check
      checkOut: "2027-01-02", // crosses into a date with no rate at all
      adults: 1,
      children: 0,
      baseOccupancy: 2,
      ratePeriods: [STANDARD_RATE],
      gstEnabled: false,
      gstPercent: 10,
      depositPercent: 30,
    }), NoRateForNightError
  );
});

// ---------------------------------------------------------------------------
// booking reference generation
// ---------------------------------------------------------------------------

test("generateBookingRef produces a WL- prefixed reference under 12 chars", () => {
  const ref = generateBookingRef();
  assert.match(ref, /^WL-[A-Z0-9]+$/);
  assert.ok(ref.length <= 12);
});

test("generateBookingRef produces distinct values across many calls", () => {
  const refs = new Set(Array.from({ length: 200 }, () => generateBookingRef()));
  assert.ok(refs.size > 190, `expected near-unique refs, got ${refs.size}/200 unique`);
});
