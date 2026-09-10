import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { notifyStaff, playAlertSound } from "@/lib/desktop";
import { formatPGK, todayStr } from "@wellness-lodge/shared";
import type { Booking, StaffRole } from "@wellness-lodge/shared";
import { Badge, Card, EmptyState } from "@/components/ui";
import BookingDrawer from "@/components/BookingDrawer";

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

function BookingRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 text-left last:border-b-0 hover:bg-stone-50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-900">{booking.bookingRef}</p>
          <Badge tone={STATUS_TONE[booking.status] ?? "stone"}>{booking.status.replaceAll("_", " ")}</Badge>
        </div>
        <p className="truncate text-sm text-stone-600">
          {booking.guest.name} &middot; {booking.price.categoryName} &middot; {booking.checkIn} → {booking.checkOut}
        </p>
      </div>
      <p className="shrink-0 font-medium text-stone-900">{formatPGK(booking.price.totalToea)}</p>
    </button>
  );
}

export default function Queue({ role }: { role: StaffRole }) {
  const [tab, setTab] = useState<Tab>("action");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [searchRef, setSearchRef] = useState("");
  const [searchResult, setSearchResult] = useState<Booking | null | "not-found">(null);
  const knownIds = useRef<Set<string> | null>(null);

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
  // in the needs-action queue (skip the very first load so opening the app
  // doesn't alarm on the existing backlog).
  useEffect(() => {
    if (knownIds.current === null) {
      knownIds.current = new Set(needsAction.map((b) => b.id));
      return;
    }
    for (const b of needsAction) {
      if (!knownIds.current.has(b.id)) {
        notifyStaff("New reservation request", `${b.bookingRef} — ${b.guest.name} (${b.price.categoryName})`);
        playAlertSound();
      }
    }
    knownIds.current = new Set(needsAction.map((b) => b.id));
  }, [needsAction]);

  async function handleSearch() {
    const ref = searchRef.trim().toUpperCase();
    if (!ref) return;
    const snap = await getDoc(doc(db, "bookings", ref));
    setSearchResult(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : "not-found");
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
              placeholder="Booking reference, e.g. WL-ABC123"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Search
            </button>
          </div>
          {searchResult === "not-found" && <p className="mt-3 text-sm text-red-600">No booking with that reference.</p>}
          {searchResult && searchResult !== "not-found" && (
            <div className="mt-4">
              <Card>
                <BookingRow booking={searchResult} onOpen={() => setSelected(searchResult)} />
              </Card>
            </div>
          )}

          <p className="mt-8 text-sm font-medium text-stone-700">Recent bookings</p>
          <Card className="mt-2">
            {recent.length === 0 && <EmptyState>No bookings yet.</EmptyState>}
            {recent.map((b) => (
              <BookingRow key={b.id} booking={b} onOpen={() => setSelected(b)} />
            ))}
          </Card>
        </div>
      ) : (
        <Card className="mt-5">
          {list.length === 0 && <EmptyState>Nothing here right now.</EmptyState>}
          {list.map((b) => (
            <BookingRow key={b.id} booking={b} onOpen={() => setSelected(b)} />
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
