import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, auth } from "../lib/admin";
import { badRequest, requireSignedIn, notFound } from "../lib/errors";
import { loadActiveStaff, assertRole } from "../lib/staff";
import { writeAuditNow } from "../lib/audit";
import type { StaffRole, RatePeriod } from "@wellness-lodge/shared";

const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  role: z.enum(["FRONT_DESK", "MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"]),
  temporaryPassword: z.string().min(8),
});

/** Administrator only — provisions a staff login (Firebase Auth user + Firestore profile). */
export const createStaffUser = onCall({ cors: true }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["ADMINISTRATOR"]);
  const input = createStaffSchema.parse(req.data);

  const userRecord = await auth.createUser({
    email: input.email,
    password: input.temporaryPassword,
    displayName: input.name,
  });

  const now = new Date().toISOString();
  await db.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    name: input.name,
    email: input.email,
    role: input.role as StaffRole,
    active: true,
    createdAt: now,
    deactivatedAt: null,
  });

  await writeAuditNow({
    actorUid: staff.uid,
    actorName: staff.name,
    action: "staff.create",
    targetType: "user",
    targetId: userRecord.uid,
    after: { email: input.email, role: input.role },
  });

  return { uid: userRecord.uid };
});

const deactivateSchema = z.object({ uid: z.string().min(1), reason: z.string().min(3).max(300) });

/** Administrator only — revokes portal + front-desk app access immediately. */
export const deactivateStaffUser = onCall({ cors: true }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["ADMINISTRATOR"]);
  const { uid, reason } = deactivateSchema.parse(req.data);

  await db.collection("users").doc(uid).update({ active: false, deactivatedAt: new Date().toISOString() });
  await auth.revokeRefreshTokens(uid);

  await writeAuditNow({
    actorUid: staff.uid,
    actorName: staff.name,
    action: "staff.deactivate",
    targetType: "user",
    targetId: uid,
    reason,
  });

  return { ok: true };
});

const ratePeriodSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  label: z.string().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  nightlyRateToea: z.number().int().min(0),
  extraAdultToea: z.number().int().min(0),
  childRateToea: z.number().int().min(0),
  minStayNights: z.number().int().min(1).max(60),
  active: z.boolean(),
});

/**
 * Manager/Admin only — validates that the saved rate period does not
 * overlap any other ACTIVE period for the same category before writing.
 * (Acceptance test: "The system rejects overlapping rate periods and
 * records the previous and new values for approved changes.")
 */
export const saveRatePeriod = onCall({ cors: true }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["MANAGER", "ADMINISTRATOR"]);
  const input = ratePeriodSchema.parse(req.data);

  if (input.endDate < input.startDate) badRequest("End date must be on or after the start date.");

  const existingSnap = await db
    .collection("ratePeriods")
    .where("categoryId", "==", input.categoryId)
    .where("active", "==", true)
    .get();

  const overlaps = existingSnap.docs.some((d) => {
    if (d.id === input.id) return false;
    const r = d.data() as RatePeriod;
    return input.startDate <= r.endDate && r.startDate <= input.endDate;
  });
  if (overlaps && input.active) {
    badRequest("This rate period overlaps an existing active rate period for the same room category.");
  }

  const ref = input.id ? db.collection("ratePeriods").doc(input.id) : db.collection("ratePeriods").doc();
  const before = input.id ? (await ref.get()).data() ?? null : null;
  const record: RatePeriod = { ...input, id: ref.id };
  await ref.set(record, { merge: true });

  await writeAuditNow({
    actorUid: staff.uid,
    actorName: staff.name,
    action: "rate.save",
    targetType: "ratePeriod",
    targetId: ref.id,
    before,
    after: record,
  });

  return { id: ref.id };
});

const overrideSchema = z.object({
  bookingRef: z.string().min(4),
  field: z.enum(["status", "paymentStatus"]),
  value: z.string(),
  reason: z.string().min(5).max(500),
});

/**
 * Manager/Admin only — a documented escape hatch for situations the normal
 * flow doesn't cover. Always reasoned and audited (architecture doc §6:
 * "Staff overrides require a reason and remain visible in the audit
 * history"). Does not touch inventory counters — use cancelBooking /
 * confirmBooking for anything that should also change the room lock.
 */
export const overrideBookingField = onCall({ cors: true }, async (req) => {
  requireSignedIn(req.auth);
  const staff = await loadActiveStaff(req.auth.uid);
  assertRole(staff, ["MANAGER", "ADMINISTRATOR"]);
  const { bookingRef, field, value, reason } = overrideSchema.parse(req.data);

  const ref = db.collection("bookings").doc(bookingRef.toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) notFound("Booking not found.");
  const before = snap.data();

  await ref.update({ [field]: value, updatedAt: new Date().toISOString() });
  await writeAuditNow({
    actorUid: staff.uid,
    actorName: staff.name,
    action: "booking.override",
    targetType: "booking",
    targetId: bookingRef.toUpperCase(),
    before: { [field]: before?.[field] },
    after: { [field]: value },
    reason,
  });

  return { ok: true };
});
