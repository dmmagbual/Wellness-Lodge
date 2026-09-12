import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyStaff, startAlertLoop, stopAlertLoop } from "@/lib/desktop";
import type { Booking } from "@wellness-lodge/shared";

/**
 * Always-on watcher for bookings needing front-desk action (AWAITING_FRONT_DESK
 * or HELD). Mounted once at the App root so a new reservation is caught no
 * matter which screen is open -- previously this same query only lived
 * inside the Front Desk queue view, so staff on the Dashboard or another tab
 * never saw or heard anything until they happened to switch back.
 *
 * Distinguishes "still sitting in the queue" (an ordinary business fact,
 * shown all day in the queue tab) from "not yet acknowledged" (rings + shows
 * a banner until a human clicks it). Dismissing silences the alert without
 * touching the booking itself -- it still needs to be actually processed in
 * the queue. A booking that leaves and later somehow re-enters the
 * needs-action set (e.g. an admin reverts its status) is treated as new
 * again rather than staying silently acknowledged forever.
 */
export function useNeedsActionAlert(enabled: boolean) {
  const [pending, setPending] = useState<Booking[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const acknowledgedIds = useRef<Set<string>>(new Set());
  const armed = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    armed.current = false;
    knownIds.current = null;
    acknowledgedIds.current = new Set();

    const q = query(
      collection(db, "bookings"),
      where("status", "in", ["AWAITING_FRONT_DESK", "HELD"]),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
      const currentIds = new Set(docs.map((b) => b.id));

      if (!armed.current) {
        // Settling-in period: onSnapshot can deliver an incomplete/cache-only
        // result before the authoritative server result lands right after
        // mount, so the very first update isn't reliably "the real backlog".
        // Absorb whatever arrives in the first couple of seconds into the
        // baseline without alerting -- otherwise every app launch re-rings
        // for the entire existing backlog instead of only genuinely new
        // arrivals.
        knownIds.current = currentIds;
        setPending([]); // stays empty until armed -- no alerting on the existing backlog at launch
        return;
      }

      const freshlyArrived = docs.filter((b) => !knownIds.current!.has(b.id));
      for (const b of freshlyArrived) {
        notifyStaff("New reservation request", `${b.bookingRef} — ${b.guest.name} (${b.price.categoryName})`);
      }

      // Forget "acknowledged" for anything that has left the needs-action
      // set entirely -- if it ever comes back, it's new again, not silently
      // pre-dismissed.
      for (const id of acknowledgedIds.current) {
        if (!currentIds.has(id)) acknowledgedIds.current.delete(id);
      }

      knownIds.current = currentIds;
      setPending(docs.filter((b) => !acknowledgedIds.current.has(b.id)));
    });

    const armTimer = setTimeout(() => {
      armed.current = true;
    }, 2000);

    return () => {
      unsub();
      clearTimeout(armTimer);
      stopAlertLoop();
    };
  }, [enabled]);

  useEffect(() => {
    if (pending.length > 0) startAlertLoop();
    else stopAlertLoop();
  }, [pending.length]);

  function acknowledge(): void {
    for (const b of pending) acknowledgedIds.current.add(b.id);
    setPending([]);
  }

  return { pending, acknowledge };
}
