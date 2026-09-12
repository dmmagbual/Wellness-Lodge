import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, limit, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { notifyStaff, playAlertSound } from "@/lib/desktop";
import { useRoomCategories } from "@/lib/useRoomCategories";
import { formatPGK, todayStr } from "@wellness-lodge/shared";
import type { Booking, StaffRole } from "@wellness-lodge/shared";
import { Badge, Card, EmptyState, PaymentStatusFlag } from "@/components/ui";
import BookingDrawer from "@/components/BookingDrawer";
import RoomThumb from "@/components/RoomThumb";

const STATUS_TONE: Record<string, "amber" | "emerald" | "stone" | "red" | "blue"> = {
  AWAITING_RECEIPT: "amber",
  AWAITING_FRONT_DESK: "amber",
  HELD: "blue",
  CONFIRMED: "emerald",
  CHECKED_IN: "emerald",
  COMPLETED: "stone",
  EXPIRED: "red",
  CANCELLED: "red",
  REJECTED: "red",
};

type Tab = "action" | "arrivals" | "inhouse" | "search";

function BookingRow({
  booking,
  images,
  onOpen,
}: {
  booking: Booking;
  images?: string[];
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 text-left last:border-b-0 hover:bg-stone-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <RoomThumb images={images} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-stone-900">{booking.bookingRef}</p>
            <Badge tone={STATUS_TONE[booking.status] ?? "stone"}>{booking.status.replaceAll("_", " ")}</Badge>
            <PaymentStatusFlag paymentStatus={booking.paymentStatus} />
          </div>
          <p className="truncate text-sm text-stone-600">
            {booking.guest.name} &middot; {booking.price.categoryName} &middot; {booking.checkIn} → {booking.checkOut}
          </p>
        </div>
      </div>
      <p className="shrink-0 font-medium text-stone-900">{formatPGK(booking.price.totalToea)}</p>
    </button>
  );
}

export default function Queue({ role, initialTab }: { role: StaffRole; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "action");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[] | "not-found" | null>(null);
  const [searching, setSearching] = useState(false);
  const { byId: categoriesById } = useRoomCategories();
  const knownIds = useRef<Set<string> | null>(null);
  // Firestore's onSnapshot can deliver more than one update right after
  // mount -- an incomplete/cache-only result before the authoritative
  // server result lands -- so "the very first update is the real backlog"
  // isn't reliable. Absorb every update that arrives in the first couple of
  // seconds after mount into the baseline without alerting, THEN start
  // treating new arrivals as new. Without this, every relaunch re-alerts on
  // the entire existing backlog once the real (second) snapshot replaces an
  // initial empty/partial one -- which is exactly why the sound kept
  // repeating across restarts instead of only firing for genuinely new
  // bookings.
  const armed = useRef(false);

  const { data: needsAction } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "in", ["AWAITING_FRONT_DESK", "HELD"]), orderBy("createdAt", "asc")),
    []
  );

  const { data: arrivals } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CONFIRMED"), where("checkIn", "==", todayStr())),
    []
  );

  const { data: inHouse } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CHECKED_IN"), orderBy("checkOut", "asc")),
    []
  );

  const { data: recent } = useCollection<Booking>(
    () => query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(25)),
    []
  );

  // Alerts: fire a native notification + sound the moment a NEW item lands
  // in the needs-action queue (skip the settling-in period below so opening
  // the app doesn't alarm on the existing backlog).
  useEffect(() => {
    const currentIds = new Set(needsAction.map((b) => b.id));
    if (!armed.current) {
      knownIds.current = currentIds;
      return;
    }
    for (const b of needsAction) {
      if (!knownIds.current!.has(b.id)) {
        notifyStaff("New reservation request", `${b.bookingRef} — ${b.guest.name} (${b.price.categoryName})`);
        playAlertSound();
      }
    }
    knownIds.current = currentIds;
  }, [needsAction]);

  // Arms alerting 2s after mount, once Firestore's initial snapshot(s) have
  // had time to settle -- see the comment on `armed` above.
  useEffect(() => {
    const t = setTimeout(() => {
      armed.current = true;
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  /**
   * Matches by booking reference (exact id lookup), or by guest email, phone
   * or name — whichever look-alike the term matches. Firestore has no
   * case-insensitive or "contains" search built in: email/phone need an
   * exact match against what the guest typed at booking time, and name only
   * matches as a prefix (also case-sensitive). Good enough for a small front
   * desk looking up a guest standing in front of them; not a full search
   * engine — if that becomes a real pain point, a proper search index
   * (Algolia/Typesense) is the right fix, not more client-side query hacks.
   */
  async function handleSearch() {
    const term = searchTerm.trim();
    if (!term) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const compact = term.replace(/\s+/g, "");
      if (/^wl-?[a-z0-9]{4,}$/i.test(compact)) {
        const snap = await getDoc(doc(db, "bookings", compact.toUpperCase()));
        if (snap.exists()) {
          setSearchResults([{ id: snap.id, ...snap.data() } as Booking]);
          return;
        }
      }

      const lookups: Promise<Booking[]>[] = [];
      if (term.includes("@")) {
        lookups.push(
          getDocs(query(collection(db, "bookings"), where("guest.email", "==", term), limit(10))).then((snap) =>
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
          )
        );
      }
      const digitsOnly = term.replace(/[^0-9+]/g, "");
      if (digitsOnly.length >= 5) {
        lookups.push(
          getDocs(query(collection(db, "bookings"), where("guest.phone", "==", term), limit(10))).then((snap) =>
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
          )
        );
      }
      // Case-insensitive: matched against guestNameLower (a lowercase copy
      // stored at booking creation), not the display-cased guest.name.
      // Bookings created before this field existed won't turn up here until
      // they're re-saved -- an accepted gap, not silently hidden.
      const nameLower = term.toLowerCase();
      lookups.push(
        getDocs(
          query(
            collection(db, "bookings"),
            where("guestNameLower", ">=", nameLower),
            where("guestNameLower", "<=", nameLower + ""),
            limit(10)
          )
        ).then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
      );

      const results = await Promise.all(lookups);
      const merged = new Map<string, Booking>();
      for (const list of results) {
        for (const b of list) merged.set(b.id, b);
      }
      const final = Array.from(merged.values());
      setSearchResults(final.length > 0 ? final : "not-found");
    } finally {
      setSearching(false);
    }
  }

  const list = tab === "action" ? needsAction : tab === "arrivals" ? arrivals : tab === "inhouse" ? inHouse : recent;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["action", `Needs action (${needsAction.length})`],
            ["arrivals", `Arrivals today (${arrivals.length})`],
            ["inhouse", `In house (${inHouse.length})`],
            ["search", "All bookings / search"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              tab === key ? "bg-emerald-700 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "search" ? (
        <div className="mt-5">
          <div className="flex max-w-md gap-2">
            <input
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              placeholder="Reference, guest name, phone or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {searchResults === "not-found" && <p className="mt-3 text-sm text-red-600">No matching booking found.</p>}
          {Array.isArray(searchResults) && (
            <div className="mt-4">
              <Card>
                {searchResults.map((b) => (
                  <BookingRow key={b.id} booking={b} images={categoriesById.get(b.categoryId)?.images} onOpen={() => setSelected(b)} />
                ))}
              </Card>
            </div>
          )}

          <p className="mt-8 text-sm font-medium text-stone-700">Recent bookings</p>
          <Card className="mt-2">
            {recent.length === 0 && <EmptyState>No bookings yet.</EmptyState>}
            {recent.map((b) => (
              <BookingRow key={b.id} booking={b} images={categoriesById.get(b.categoryId)?.images} onOpen={() => setSelected(b)} />
            ))}
          </Card>
        </div>
      ) : (
        <Card className="mt-5">
          {list.length === 0 && <EmptyState>Nothing here right now.</EmptyState>}
          {list.map((b) => (
            <BookingRow key={b.id} booking={b} images={categoriesById.get(b.categoryId)?.images} onOpen={() => setSelected(b)} />
          ))}
        </Card>
      )}

      {selected && (
        <BookingDrawer
          booking={selected}
          role={role}
          onClose={() => setSelected(null)}
          onActionDone={() => setSelected(null)}
        />
      )}
    </div>
  );
}
