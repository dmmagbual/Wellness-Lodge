import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/admin";
import { badRequest, notFound, requireSignedIn } from "../lib/errors";
import { loadActiveStaff, assertRole } from "../lib/staff";
import {
  checkAndPrepareNights,
  commitNightIncrement,
  commitNightTransition,
  readNightsInTxn,
  readNights,
  releaseNights,
} from "../lib/inventory";
import { writeAudit, writeAuditNow } from "../lib/audit";
import {
  RESEND_API_KEY,
  sendBookingConfirmedEmail,
  sendReceiptRejectedEmail,
  sendBookingCancelledEmail,
} from "../lib/mail";
import {
  nightsBetween,
  addHoursIso,
  computePriceSnapshot,
  generateBookingRef,
  isValidDateStr,
  todayStr,
  type Booking,
  type RoomCategory,
  type RatePeriod,
  type LodgeSettings,
} from "@wellness-lodge/shared";

const refSchema = z.object({ bookingRef: z.string().min(4) });

/**
 * Front desk accepts a "pay at front desk" request. This is the moment the
 * 12-hour hold begins (architecture doc §5.4: "the system creates a 12 hour
 * hold and displays the exact expiry time"), and the first time inventory
 * is actually locked for this booking.
 */
export const acceptPayAtDesk = onCall({ cors: true, invoker: "public" }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef } = refSchema.parse(req.data);

  const bookingRefDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingRefDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;
    if (booking.status !== "AWAITING_FRONT_DESK" || booking.paymentMethod !== "PAY_AT_FRONT_DESK") {
      badRequest("This booking is not an open pay-at-desk request.");
    }

    const catSnap = await txn.get(db.collection("roomCategories").doc(booking.categoryId));
    const category = catSnap.data() as RoomCategory;
    const nights = nightsBetween(booking.checkIn, booking.checkOut);

    // All reads — including this settings lookup — must happen before any
    // write in the transaction (Firestore requirement). checkAndPrepareNights
    // only reads; commitNightIncrement is what writes, so the settings read
    // has to come before that write, not after it.
    const settingsSnap = await txn.get(db.collection("settings").doc("public"));
    const settings = (settingsSnap.exists ? settingsSnap.data() : {}) as Partial<LodgeSettings>;
    const holdHours = settings.payAtDeskHoldHours ?? 12;
    const holdExpiresAt = addHoursIso(holdHours);
    const now = new Date().toISOString();

    const current = await checkAndPrepareNights(txn, booking.categoryId, category.totalRooms, nights);
    commitNightIncrement(txn, booking.categoryId, category.totalRooms, nights, current, "held");

    txn.update(bookingRefDoc, { status: "HELD", holdExpiresAt, updatedAt: now });
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.acceptPayAtDesk",
      targetType: "booking",
      targetId: booking.bookingRef,
      before: { status: booking.status },
      after: { status: "HELD", holdExpiresAt },
    });
  });

  return { ok: true };
});

const confirmSchema = z.object({ bookingRef: z.string().min(4), note: z.string().max(500).optional() });

/**
 * Staff confirms payment — covers both paths:
 *  - HELD (pay-at-desk): moves the existing hold to a confirmed lock.
 *  - AWAITING_FRONT_DESK with a submitted bank-transfer receipt: locks
 *    inventory for the first time, right now, at verification (per the
 *    architecture doc: a bank-transfer request is not locked until staff
 *    verify it against the bank account).
 * "Staff must compare the uploaded receipt with the bank account before
 * marking the payment as verified" is a manual, off-system step the desk
 * performs before calling this.
 */
export const confirmBooking = onCall({ cors: true, invoker: "public", secrets: [RESEND_API_KEY] }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef, note } = confirmSchema.parse(req.data);
  const bookingDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;

    if (!["HELD", "AWAITING_FRONT_DESK"].includes(booking.status)) {
      badRequest(`Cannot confirm a booking in status ${booking.status}.`);
    }

    const catSnap = await txn.get(db.collection("roomCategories").doc(booking.categoryId));
    const category = catSnap.data() as RoomCategory;
    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    const now = new Date().toISOString();

    if (booking.status === "HELD") {
      // Already reserved as `held` when the front desk accepted the request —
      // this is an accounting move (held -> booked), not a new capacity
      // decision, so no capacity check is applied here.
      const current = await readNightsInTxn(txn, booking.categoryId, nights);
      commitNightTransition(txn, booking.categoryId, nights, current);
    } else {
      // AWAITING_FRONT_DESK via bank transfer — first lock, check capacity now.
      const current = await checkAndPrepareNights(txn, booking.categoryId, category.totalRooms, nights);
      commitNightIncrement(txn, booking.categoryId, category.totalRooms, nights, current, "booked");
    }

    txn.update(bookingDoc, {
      status: "CONFIRMED",
      paymentStatus: "VERIFIED",
      holdExpiresAt: null,
      confirmedBy: staff.uid,
      confirmedAt: now,
      updatedAt: now,
    });

    // Mark the most recent pending receipt (if any) verified.
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.confirm",
      targetType: "booking",
      targetId: booking.bookingRef,
      before: { status: booking.status },
      after: { status: "CONFIRMED" },
      reason: note,
    });
  });

  const receiptsSnap = await db
    .collection("paymentReceipts")
    .where("bookingRef", "==", bookingRef.toUpperCase())
    .where("status", "==", "PENDING")
    .get();
  const batch = db.batch();
  const now = new Date().toISOString();
  receiptsSnap.docs.forEach((d) =>
    batch.update(d.ref, { status: "VERIFIED", reviewedBy: staff.uid, reviewedAt: now })
  );
  if (!receiptsSnap.empty) await batch.commit();

  // Guest-facing courtesy notification -- re-read post-transaction rather
  // than threading the txn-scoped `booking` variable out, and never allowed
  // to fail this call (see lib/mail.ts): the confirmation itself is already
  // durably saved above regardless of whether the email goes out.
  const confirmedSnap = await bookingDoc.get();
  await sendBookingConfirmedEmail(confirmedSnap.data() as Booking);

  return { ok: true };
});

const rejectSchema = z.object({
  bookingRef: z.string().min(4),
  reason: z.string().min(3).max(500),
});

/** Staff rejects a submitted receipt — asks the guest for a clearer one. No inventory change: bank-transfer bookings are never locked before verification. */
export const rejectReceipt = onCall({ cors: true, invoker: "public", secrets: [RESEND_API_KEY] }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef, reason } = rejectSchema.parse(req.data);
  const bookingDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;
    if (booking.status !== "AWAITING_FRONT_DESK" || booking.paymentMethod !== "BANK_TRANSFER") {
      badRequest("Only a submitted bank-transfer receipt can be rejected.");
    }
    const now = new Date().toISOString();
    txn.update(bookingDoc, { paymentStatus: "REJECTED", status: "AWAITING_RECEIPT", updatedAt: now });
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.rejectReceipt",
      targetType: "booking",
      targetId: booking.bookingRef,
      reason,
    });
  });

  const receiptsSnap = await db
    .collection("paymentReceipts")
    .where("bookingRef", "==", bookingRef.toUpperCase())
    .where("status", "==", "PENDING")
    .get();
  const batch = db.batch();
  const now = new Date().toISOString();
  receiptsSnap.docs.forEach((d) =>
    batch.update(d.ref, { status: "REJECTED", reviewedBy: staff.uid, reviewedAt: now, reviewNote: reason })
  );
  if (!receiptsSnap.empty) await batch.commit();

  const rejectedSnap = await bookingDoc.get();
  await sendReceiptRejectedEmail(rejectedSnap.data() as Booking, reason);

  return { ok: true };
});

const cancelSchema = z.object({ bookingRef: z.string().min(4), reason: z.string().min(3).max(500) });

/** Staff cancels a booking — releases inventory if it was locked. Overrides are always reasoned + audited. */
export const cancelBooking = onCall({ cors: true, invoker: "public", secrets: [RESEND_API_KEY] }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef, reason } = cancelSchema.parse(req.data);
  const bookingDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;
    if (["CANCELLED", "COMPLETED", "EXPIRED", "REJECTED"].includes(booking.status)) {
      badRequest(`Booking is already ${booking.status}.`);
    }

    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    const now = new Date().toISOString();

    if (booking.status === "HELD" || booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") {
      const field = booking.status === "HELD" ? "held" : "booked";
      const refs = nights.map((d) =>
        db.collection("inventory").doc(booking.categoryId).collection("nights").doc(d)
      );
      const snaps = await Promise.all(refs.map((r) => txn.get(r)));
      const current = new Map<string, { held: number; booked: number }>();
      snaps.forEach((s, i) => {
        current.set(nights[i], s.exists ? (s.data() as { held: number; booked: number }) : { held: 0, booked: 0 });
      });
      releaseNights(txn, booking.categoryId, nights, current, field);
    }

    txn.update(bookingDoc, {
      status: "CANCELLED",
      cancelledReason: reason,
      holdExpiresAt: null,
      updatedAt: now,
    });
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.cancel",
      targetType: "booking",
      targetId: booking.bookingRef,
      before: { status: booking.status },
      after: { status: "CANCELLED" },
      reason,
    });
  });

  const cancelledSnap = await bookingDoc.get();
  await sendBookingCancelledEmail(cancelledSnap.data() as Booking, reason);

  return { ok: true };
});

const checkInOutSchema = z.object({ bookingRef: z.string().min(4), roomId: z.string().optional() });

export const checkInGuest = onCall({ cors: true, invoker: "public" }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef, roomId } = checkInOutSchema.parse(req.data);
  const bookingDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;
    if (booking.status !== "CONFIRMED") badRequest("Only a confirmed booking can be checked in.");
    const now = new Date().toISOString();
    txn.update(bookingDoc, { status: "CHECKED_IN", roomId: roomId ?? null, updatedAt: now });
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.checkIn",
      targetType: "booking",
      targetId: booking.bookingRef,
    });
  });
  return { ok: true };
});

export const checkOutGuest = onCall({ cors: true, invoker: "public" }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const { bookingRef } = checkInOutSchema.parse(req.data);
  const bookingDoc = db.collection("bookings").doc(bookingRef.toUpperCase());

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(bookingDoc);
    if (!snap.exists) notFound("Booking not found.");
    const booking = snap.data() as Booking;
    if (booking.status !== "CHECKED_IN") badRequest("Only a checked-in guest can be checked out.");

    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    const refs = nights.map((d) =>
      db.collection("inventory").doc(booking.categoryId).collection("nights").doc(d)
    );
    const snaps = await Promise.all(refs.map((r) => txn.get(r)));
    const current = new Map<string, { held: number; booked: number }>();
    snaps.forEach((s, i) => {
      current.set(nights[i], s.exists ? (s.data() as { held: number; booked: number }) : { held: 0, booked: 0 });
    });
    releaseNights(txn, booking.categoryId, nights, current, "booked");

    const now = new Date().toISOString();
    txn.update(bookingDoc, { status: "COMPLETED", updatedAt: now });
    writeAudit(txn, {
      actorUid: staff.uid,
      actorName: staff.name,
      action: "booking.checkOut",
      targetType: "booking",
      targetId: booking.bookingRef,
    });
  });
  return { ok: true };
});

const guestInputSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  // .nullish() not .optional(): Firebase's callable SDK turns an `undefined`
  // field into `null` on the wire, so a blank notes box arrives as `null`,
  // not a missing key. .optional() alone rejects that with "expected string,
  // received null" — confirmed live via this exact crash.
  notes: z.string().max(1000).nullish(),
});

const createWalkInSchema = z.object({
  categoryId: z.string().min(1),
  checkIn: z.string().refine(isValidDateStr, "Invalid date, expected YYYY-MM-DD"),
  checkOut: z.string().refine(isValidDateStr, "Invalid date, expected YYYY-MM-DD"),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guest: guestInputSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "PAY_AT_FRONT_DESK"]),
  source: z.enum(["WALK_IN", "PHONE"]),
});

/**
 * Front desk creates a booking on behalf of a guest who walked in or called
 * in — the data model already had a slot for this (`source: WALK_IN | PHONE`)
 * but no function ever wrote one. Deliberately mirrors createBooking
 * (guestBooking.ts) field-for-field — same advisory availability check, same
 * price snapshot, same status assignment — so the result drops straight into
 * the existing accept/confirm/check-in flow with no new state-machine
 * branches. Inventory is NOT locked here, same as a guest booking; the lock
 * still happens at acceptPayAtDesk / confirmBooking via the normal
 * BookingDrawer actions.
 */
export const createWalkInBooking = onCall({ cors: true, invoker: "public" }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"]);
  const input = createWalkInSchema.parse(req.data);

  if (input.checkOut <= input.checkIn) badRequest("Check-out must be after check-in.");
  if (input.checkIn < todayStr()) badRequest("Check-in cannot be in the past.");

  const [catSnap, ratesSnap, settingsSnap] = await Promise.all([
    db.collection("roomCategories").doc(input.categoryId).get(),
    db.collection("ratePeriods").where("categoryId", "==", input.categoryId).where("active", "==", true).get(),
    db.collection("settings").doc("public").get(),
  ]);
  if (!catSnap.exists) notFound("Room category not found.");
  const category = catSnap.data() as RoomCategory;
  if (!category.active) badRequest("This room type is not currently available.");

  const settings = (settingsSnap.exists ? settingsSnap.data() : {}) as Partial<LodgeSettings>;
  const ratePeriods = ratesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as RatePeriod);

  const price = computePriceSnapshot({
    categoryId: input.categoryId,
    categoryName: category.name,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.children,
    baseOccupancy: category.maxAdults,
    addOnsToea: 0,
    ratePeriods,
    gstEnabled: settings.gstEnabled ?? false,
    gstPercent: settings.gstPercent ?? 10,
    depositPercent: settings.depositPercent ?? 30,
  });

  // Advisory availability check (not a lock) — same as the public booking
  // flow. The real lock happens later, at acceptPayAtDesk / confirmBooking.
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightData = await readNights(input.categoryId, nights);
  for (const date of nights) {
    const d = nightData.get(date) ?? { held: 0, booked: 0 };
    if (category.totalRooms - (d.held ?? 0) - (d.booked ?? 0) <= 0) {
      badRequest(`No rooms of this type are available on ${date}. Please choose different dates.`);
    }
  }

  const bookingRef = generateBookingRef();
  const now = new Date().toISOString();
  const receiptDeadlineHours = settings.receiptDeadlineHours ?? 48;

  const booking: Booking = {
    id: bookingRef,
    bookingRef,
    categoryId: input.categoryId,
    roomId: null,
    // Normalize the wire's `null` (Firebase's callable SDK sends undefined
    // fields as null) back to `undefined` so the stored shape matches
    // GuestDetails exactly, same as before this schema accepted null.
    guest: { ...input.guest, notes: input.guest.notes ?? undefined },
    guestNameLower: input.guest.name.trim().toLowerCase(),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: nights.length,
    price,
    paymentMethod: input.paymentMethod,
    status: input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_RECEIPT" : "AWAITING_FRONT_DESK",
    paymentStatus: "UNPAID",
    holdExpiresAt: null,
    receiptDeadlineAt: input.paymentMethod === "BANK_TRANSFER" ? addHoursIso(receiptDeadlineHours) : null,
    confirmedBy: null,
    confirmedAt: null,
    cancelledReason: null,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("bookings").doc(bookingRef).set(booking);
  await writeAuditNow({
    actorUid: staff.uid,
    actorName: staff.name,
    action: "booking.createWalkIn",
    targetType: "booking",
    targetId: bookingRef,
    after: booking,
  });

  const bank = {
    bankName: settings.bankName ?? "",
    bankAccountName: settings.bankAccountName ?? "",
    bankAccountNumber: settings.bankAccountNumber ?? "",
    bankBranch: settings.bankBranch ?? "",
  };

  return { booking, bank };
});
