import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/admin";

const enquirySchema = z.object({
  type: z.enum(["CAR_RENTAL", "FUNCTION_HALL", "RESTAURANT_CAFE", "CATERING", "GENERAL"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  preferredDate: z.string().optional(),
  message: z.string().min(3).max(2000),
});

/**
 * Public — car rental, function hall, restaurant/cafe and catering are
 * information + enquiry pages in this release (architecture doc §8.1: "Only
 * services selected for the approved first release will be built into
 * transactional workflows" — the approved Phase 2 scope quoted is the room
 * booking engine). This lands every enquiry straight in the front desk
 * app's Enquiries inbox with a live listener, same as bookings.
 */
export const submitEnquiry = onCall({ cors: true }, async (req) => {
  const input = enquirySchema.parse(req.data);
  const ref = db.collection("enquiries").doc();
  const now = new Date().toISOString();
  await ref.set({
    id: ref.id,
    ...input,
    preferredDate: input.preferredDate ?? null,
    status: "NEW",
    createdAt: now,
    handledBy: null,
  });
  return { ok: true, id: ref.id };
});
