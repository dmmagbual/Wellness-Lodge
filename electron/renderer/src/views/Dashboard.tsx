import { useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK, todayStr } from "@wellness-lodge/shared";
import type { Booking, Enquiry, StaffRole } from "@wellness-lodge/shared";
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

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "amber" | "red" }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-stone-900"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

function MiniRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
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
          {booking.guest.name} &middot; {booking.price.categoryName} &middot; {formatPGK(booking.price.totalToea)}
        </p>
      </div>
      <p className="shrink-0 text-sm text-stone-500">
        {booking.checkIn} → {booking.checkOut}
      </p>
    </button>
  );
}

function BookingList({
  title,
  bookings,
  emptyText,
  onOpen,
}: {
  title: string;
  bookings: Booking[];
  emptyText: string;
  onOpen: (b: Booking) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-stone-700">
        {title} ({bookings.length})
      </p>
      <Card>
        {bookings.length === 0 && <EmptyState>{emptyText}</EmptyState>}
        {bookings.map((b) => (
          <MiniRow key={b.id} booking={b} onOpen={() => onOpen(b)} />
        ))}
      </Card>
    </div>
  );
}

/**
 * Front desk landing screen. Everything here reads the live `bookings` /
 * `enquiries` collections that already exist — no new Cloud Function, no new
 * data model. Two queries below (status==CONFIRMED + checkIn<today) need a
 * new Firestore composite index — see firestore.indexes.json and the note in
 * the handover message about deploying it.
 *
 * Deliberately left out (no data model for these yet, would need a new
 * module, not just a new screen): VIP flags, birthdays/anniversaries,
 * blacklist alerts, dirty/clean room counts, shift handover notes. See the
 * housekeeping/guest-CRM discussion in the handover message.
 */
export default function Dashboard({ role }: { role: StaffRole }) {
  const [selected, setSelected] = useState<Booking | null>(null);
  const today = todayStr();

  const { data: arrivals } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CONFIRMED"), where("checkIn", "==", today)),
    [today]
  );
  const { data: departures } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CHECKED_IN"), where("checkOut", "==", today)),
    [today]
  );
  const { data: inHouse } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CHECKED_IN"), orderBy("checkOut", "asc")),
    []
  );
  const { data: needsAction } = useCollection<Booking>(
    () =>
      query(
        collection(db, "bookings"),
        where("status", "in", ["AWAITING_FRONT_DESK", "HELD"]),
        orderBy("createdAt", "asc")
      ),
    []
  );
  const { data: rejectedReceipts } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "AWAITING_RECEIPT"), where("paymentStatus", "==", "REJECTED")),
    []
  );
  // No NO_SHOW status exists in this system (see handover message) — this is
  // a read-only, client-side view of "confirmed, arrival date already past,
  // never checked in." It does not change the booking's actual status.
  const { data: overdueArrivals } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CONFIRMED"), where("checkIn", "<", today)),
    [today]
  );
  const { data: enquiries } = useCollection<Enquiry>(
    () => query(collection(db, "enquiries"), orderBy("createdAt", "desc")),
    []
  );
  const openEnquiries = enquiries.filter((e) => e.status !== "CLOSED").length;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Arrivals today" value={arrivals.length} />
        <StatCard label="Departures today" value={departures.length} />
        <StatCard label="In house" value={inHouse.length} />
        <StatCard label="Needs action" value={needsAction.length} tone={needsAction.length > 0 ? "amber" : undefined} />
        <StatCard
          label="Rejected receipts"
          value={rejectedReceipts.length}
          tone={rejectedReceipts.length > 0 ? "red" : undefined}
        />
        <StatCard label="Open enquiries" value={openEnquiries} />
      </div>

      {overdueArrivals.length > 0 && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          <p className="font-semibold">
            {overdueArrivals.length} confirmed booking{overdueArrivals.length === 1 ? "" : "s"} past arrival date,
            not checked in.
          </p>
          <p className="mt-1 text-red-700">
            There's no formal "no-show" status yet — these are just confirmed bookings whose check-in date has
            already passed. Open one to cancel it, follow up with the guest, or check them in late.
          </p>
        </div>
      )}

      {overdueArrivals.length > 0 && (
        <BookingList
          title="Past arrival date, not checked in"
          bookings={overdueArrivals}
          emptyText="None."
          onOpen={setSelected}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingList title="Arrivals today" bookings={arrivals} emptyText="No arrivals today." onOpen={setSelected} />
        <BookingList
          title="Departures today"
          bookings={departures}
          emptyText="No departures today."
          onOpen={setSelected}
        />
      </div>

      <BookingList
        title="Needs front desk action"
        bookings={needsAction}
        emptyText="Nothing pending."
        onOpen={setSelected}
      />

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
