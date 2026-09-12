import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/admin";
import { badRequest, notFound } from "../lib/errors";
import { readNights } from "../lib/inventory";
import { writeAuditNow } from "../lib/audit";
import {
  computePriceSnapshot,
  generateBookingRef,
  nightsBetween,
  isValidDateStr,
  addHoursIso,
  todayStr,
  type RatePeriod,
  type RoomCategory,
  type Booking,
  type LodgeSettings,
} from "@wellness-lodge/shared";

const dateSchema = z.string().refine(isValidDateStr, "Invalid date, expected YYYY-MM-DD");

const availabilitySchema = z.object({
  categoryId: z.string().min(1),
  checkIn: dateSchema,
  checkOut: dateSchema,
});

/** Public — powers the live search on the website. No auth required. */
export const checkAvailability = onCall({ cors: true, invoker: "public" }, async (req) => {
  const { categoryId, checkIn, checkOut } = availabilitySchema.parse(req.data);
  if (checkOut <= checkIn) badRequest("Check-out must be after check-in.");
  if (checkIn < todayStr()) badRequest("Check-in cannot be in the past.");

  const catSnap = await db.collection("roomCategories").doc(categoryId).get();
  if (!catSnap.exists) notFound("Room category not found.");
  const category = catSnap.data() as RoomCategory;
  if (!category.active) return { available: false, remaining: 0 };

  const nights = nightsBetween(checkIn, checkOut);
  const nightData = await readNights(categoryId, nights);

  let minRemaining = category.totalRooms;
  for (const date of nights) {
    const d = nightData.get(date) ?? { held: 0, booked: 0 };
    const remaining = category.totalRooms - (d.held ?? 0) - (d.booked ?? 0);
    minRemaining = Math.min(minRemaining, remaining);
  }

  return { available: minRemaining > 0, remaining: Math.max(0, minRemaining) };
});

const guestSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  // .nullish() not .optional(): Firebase's callable SDK turns an `undefined`
  // field into `null` on the wire, so a blank notes box arrives as `null`,
  // not a missing key — .optional() alone rejects that. Confirmed live via
  // the identical crash in the new staff-facing createWalkInBooking, which
  // shares this exact schema shape; fixing here too since a guest leaving
  // notes blank on the real website hits the same code path.
  notes: z.string().max(1000).nullish(),
});

const createBookingSchema = z.object({
  categoryId: z.string().min(1),
  checkIn: dateSchema,
  checkOut: dateSchema,
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guest: guestSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "PAY_AT_FRONT_DESK"]),
  addOns: z.array(z.string()).max(20).optional(),
});

/**
 * Public — the only way a booking is created. Per the architecture doc,
 * this does NOT lock inventory yet: bank-transfer and pay-at-desk requests
 * sit in "no lock" states until front desk acts (spec table, §5/§6). It DOES
 * re-validate availability so guests are not invited to request dates that
 * are clearly gone, but that check is advisory — the authoritative lock
 * happens in acceptPayAtDesk / confirmBooking.
 */
export const createBooking = onCall({ cors: true, invoker: "public" }, async (req) => {
  const input = createBookingSchema.parse(req.data);
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

  // Advisory availability check (not a lock) so guests get an honest quote.
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
    source: "WEBSITE",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("bookings").doc(bookingRef).set(booking);
  await writeAuditNow({
    actorUid: "guest",
    actorName: input.guest.name,
    action: "booking.create",
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

const lookupSchema = z.object({
  bookingRef: z.string().min(4),
  email: z.string().email(),
});

/** Public — guest checks their own booking status by reference + email. */
export const lookupBooking = onCall({ cors: true, invoker: "public" }, async (req) => {
  const { bookingRef, email } = lookupSchema.parse(req.data);
  const snap = await db.collection("bookings").doc(bookingRef.toUpperCase()).get();
  if (!snap.exists) notFound("No booking found with that reference and email.");
  const booking = snap.data() as Booking;
  if (booking.guest.email.toLowerCase() !== email.toLowerCase()) {
    notFound("No booking found with that reference and email.");
  }
  return { booking };
});

const submitReceiptSchema = z.object({
  bookingRef: z.string().min(4),
  email: z.string().email(),
  storagePath: z.string().min(3),
  amountStatedToea: z.number().int().min(0),
});

/**
 * Public — called after the guest's file is already sitting in Storage
 * (Storage rules independently verify the booking is AWAITING_RECEIPT before
 * allowing the upload). This just links the receipt to the booking and
 * moves it into the front desk queue.
 */
export const submitReceipt = onCall({ cors: true, invoker: "public" }, async (req) => {
  const input = submitReceiptSchema.parse(req.data);
  const ref = db.collection("bookings").doc(input.bookingRef.toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) notFound("Booking not found.");
  const booking = snap.data() as Booking;
  if (booking.guest.email.toLowerCase() !== input.email.toLowerCase()) {
    notFound("Booking not found.");
  }
  if (!["AWAITING_RECEIPT", "AWAITING_FRONT_DESK"].includes(booking.status)) {
    badRequest("This booking is not awaiting a payment receipt.");
  }

  const receiptRef = db.collection("paymentReceipts").doc();
  const now = new Date().toISOString();
  await receiptRef.set({
    id: receiptRef.id,
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    storagePath: input.storagePath,
    amountStated: input.amountStatedToea,
    uploadedAt: now,
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  });

  await ref.update({
    status: "AWAITING_FRONT_DESK",
    paymentStatus: "RECEIPT_SUBMITTED",
    updatedAt: now,
  });

  await writeAuditNow({
    actorUid: "guest",
    actorName: booking.guest.name,
    action: "booking.submitReceipt",
    targetType: "booking",
    targetId: booking.bookingRef,
    after: { receiptId: receiptRef.id },
  });

  return { ok: true, receiptId: receiptRef.id };
});
