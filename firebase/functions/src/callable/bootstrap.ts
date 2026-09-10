import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, auth } from "../lib/admin";
import { badRequest, requireSignedIn } from "../lib/errors";

const schema = z.object({ setupCode: z.string().min(1), name: z.string().min(2).max(120) });

/**
 * One-time bootstrap: promotes the CALLING signed-in user to ADMINISTRATOR,
 * but only if no administrator exists yet AND the caller supplies the
 * setup code from functions config (`bootstrap.setup_code`, or the
 * BOOTSTRAP_SETUP_CODE env var in the emulator). This is how the very first
 * admin account is created without anyone having pre-existing admin access —
 * after that, every further staff account goes through createStaffUser.
 */
export const bootstrapFirstAdmin = onCall({ cors: true }, async (req) => {
  requireSignedIn(req.auth);
  const { setupCode, name } = schema.parse(req.data);

  const expected = process.env.BOOTSTRAP_SETUP_CODE ?? "";
  if (!expected || setupCode !== expected) {
    badRequest("Invalid setup code.");
  }

  const existingAdmins = await db.collection("users").where("role", "==", "ADMINISTRATOR").limit(1).get();
  if (!existingAdmins.empty) {
    badRequest("An administrator already exists. Ask them to create your account instead.");
  }

  const userRecord = await auth.getUser(req.auth!.uid);
  const now = new Date().toISOString();
  await db.collection("users").doc(req.auth!.uid).set({
    uid: req.auth!.uid,
    name,
    email: userRecord.email ?? "",
    role: "ADMINISTRATOR",
    active: true,
    createdAt: now,
    deactivatedAt: null,
  });

  return { ok: true };
});
