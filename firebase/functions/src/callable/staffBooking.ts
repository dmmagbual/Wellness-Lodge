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
  releaseNights,
} from "../lib/inventory";
import { writeAudit } from "../lib/audit";
import { nightsBetween, addHoursIso, type Booking, type RoomCategory, type LodgeSettings } from "@wellness-lodge/shared";

const refSchema = z.object({ bookingRef: z.string().min(4) });

/**
 * Front desk accepts a "pay at front desk" request. This is the moment the
 * 12-hour hold begins (architecture doc §5.4: "the system creates a 12 hour
 * hold and displays the exact expiry time"), and the first time inventory
 * is actually locked for this booking.
 */
export const acceptPayAtDesk = onCall({ cors: true }, async (req) => {
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
export const confirmBooking = onCall({ cors: true }, async (req) => {
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

  return { ok: true };
});

const rejectSchema = z.object({
  bookingRef: z.string().min(4),
  reason: z.string().min(3).max(500),
});

/** Staff rejects a submitted receipt — asks the guest for a clearer one. No inventory change: bank-transfer bookings are never locked before verification. */
export const rejectReceipt = onCall({ cors: true }, async (req) => {
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

  return { ok: true };
});

const cancelSchema = z.object({ bookingRef: z.string().min(4), reason: z.string().min(3).max(500) });

/** Staff cancels a booking — releases inventory if it was locked. Overrides are always reasoned + audited. */
export const cancelBooking = onCall({ cors: true }, async (req) => {
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

  return { ok: true };
});

const checkInOutSchema = z.object({ bookingRef: z.string().min(4), roomId: z.string().optional() });

export const checkInGuest = onCall({ cors: true }, async (req) => {
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

export const checkOutGuest = onCall({ cors: true }, async (req) => {
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
