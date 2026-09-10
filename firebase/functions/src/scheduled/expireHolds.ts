import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/admin";
import { releaseNights } from "../lib/inventory";
import { writeAudit } from "../lib/audit";
import { nightsBetween, type Booking } from "@wellness-lodge/shared";

/**
 * Runs every 15 minutes. Two independent sweeps:
 *  1. HELD bookings past holdExpiresAt -> release the 12h lock, mark EXPIRED
 *     (architecture doc §5.4: "a scheduled server process releases the room
 *     automatically").
 *  2. AWAITING_RECEIPT bookings past receiptDeadlineAt -> mark EXPIRED. No
 *     inventory release needed — a bank-transfer request never held inventory.
 */
export const expireHolds = onSchedule("every 15 minutes", async () => {
  const nowIso = new Date().toISOString();

  const heldSnap = await db
    .collection("bookings")
    .where("status", "==", "HELD")
    .where("holdExpiresAt", "<=", nowIso)
    .get();

  for (const doc of heldSnap.docs) {
    const booking = doc.data() as Booking;
    await db.runTransaction(async (txn) => {
      const fresh = await txn.get(doc.ref);
      const b = fresh.data() as Booking;
      if (b.status !== "HELD") return; // already acted on since the query ran
      const nights = nightsBetween(b.checkIn, b.checkOut);
      const refs = nights.map((d) =>
        db.collection("inventory").doc(b.categoryId).collection("nights").doc(d)
      );
      const snaps = await Promise.all(refs.map((r) => txn.get(r)));
      const current = new Map<string, { held: number; booked: number }>();
      snaps.forEach((s, i) => {
        current.set(nights[i], s.exists ? (s.data() as { held: number; booked: number }) : { held: 0, booked: 0 });
      });
      releaseNights(txn, b.categoryId, nights, current, "held");
      txn.update(doc.ref, { status: "EXPIRED", holdExpiresAt: null, updatedAt: new Date().toISOString() });
      writeAudit(txn, {
        actorUid: "system",
        actorName: "Scheduled expiry",
        action: "booking.autoExpireHold",
        targetType: "booking",
        targetId: b.bookingRef,
        before: { status: "HELD" },
        after: { status: "EXPIRED" },
        reason: "12-hour pay-at-desk hold expired without confirmation.",
      });
    });
    void booking; // referenced for clarity only
  }

  const receiptSnap = await db
    .collection("bookings")
    .where("status", "==", "AWAITING_RECEIPT")
    .where("receiptDeadlineAt", "<=", nowIso)
    .get();

  const batch = db.batch();
  receiptSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { status: "EXPIRED", updatedAt: nowIso });
  });
  if (!receiptSnap.empty) await batch.commit();
  for (const doc of receiptSnap.docs) {
    await db.collection("auditLog").add({
      actorUid: "system",
      actorName: "Scheduled expiry",
      action: "booking.autoExpireReceiptDeadline",
      targetType: "booking",
      targetId: doc.id,
      before: { status: "AWAITING_RECEIPT" },
      after: { status: "EXPIRED" },
      reason: "Bank-transfer receipt deadline passed with no upload.",
      timestampIso: nowIso,
    });
  }
});
