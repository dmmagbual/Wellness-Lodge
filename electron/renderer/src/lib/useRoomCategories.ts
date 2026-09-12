import { useMemo } from "react";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { RoomCategory } from "@wellness-lodge/shared";

/**
 * Full room category catalogue (not filtered to active=true) so a booking
 * against a category that's since been deactivated or renamed still
 * resolves to a name/photo here -- this is a lookup table for display,
 * not an availability list (NewBookingModal/RoomPicker filters to active
 * itself, since only active categories should be offered for new bookings).
 */
export function useRoomCategories(): { categories: RoomCategory[]; byId: Map<string, RoomCategory> } {
  const { data: categories } = useCollection<RoomCategory>(() => collection(db, "roomCategories"), []);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  return { categories, byId };
}
