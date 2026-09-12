import { useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK, todayStr } from "@wellness-lodge/shared";
import type { Booking, Enquiry, RoomCategory, StaffRole } from "@wellness-lodge/shared";
import { Badge, Card, EmptyState, PrimaryButton, PaymentStatusFlag, SectionHeading, OccupancyRing } from "@/components/ui";
import {
  IconArrival,
  IconDeparture,
  IconBed,
  IconAlert,
  IconReceiptX,
  IconMail,
  IconRefund,
} from "@/components/icons";
import BookingDrawer from "@/components/BookingDrawer";
import NewBookingModal from "@/components/NewBookingModal";
import BookingCalendar from "@/components/BookingCalendar";
import BookingsTable from "@/components/BookingsTable";

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

const TONE_ICON_BG: Record<string, string> = {
  stone: "bg-stone-100 text-stone-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

// onClick makes the whole card a button that jumps to wherever this count is
// actually explained -- either scrolled to a section further down this same
// page, or (for In house / Open enquiries, which have no list on this page)
// switched to the relevant top-level view via the callback passed in.
function StatCard({
  label,
  value,
  tone,
  icon,
  gaugePercent,
  caption,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "amber" | "red";
  icon: React.ReactNode;
  /** When set (0-100), renders a brass occupancy ring behind the icon instead of a flat tinted badge. */
  gaugePercent?: number;
  /** Small line under the value, e.g. "of 24 rooms". */
  caption?: string;
  onClick?: () => void;
}) {
  const iconTone = tone ?? "stone";
  const content = (
    <>
      {typeof gaugePercent === "number" ? (
        <div className="relative flex h-8 w-8 items-center justify-center">
          <OccupancyRing percent={gaugePercent} size={32} />
          <span className="absolute text-emerald-800">{icon}</span>
        </div>
      ) : (
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_ICON_BG[iconTone]}`}>{icon}</span>
      )}
      <p className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p
        className={`mt-0.5 font-display text-2xl font-semibold ${
          tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-stone-900"
        }`}
      >
        {value}
      </p>
      {caption && <p className="text-[11px] text-stone-400">{caption}</p>}
    </>
  );

  if (!onClick) {
    return <Card className="p-3">{content}</Card>;
  }

  return (
    <Card className="p-0">
      <button onClick={onClick} className="block w-full rounded-2xl p-3 text-left transition hover:bg-stone-50">
        {content}
      </button>
    </Card>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <Badge tone={STATUS_TONE[booking.status] ?? "stone"}>{booking.status.replace(/_/g, " ")}</Badge>
          <PaymentStatusFlag paymentStatus={booking.paymentStatus} />
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
  icon,
  tone,
  bookings,
  emptyText,
  onOpen,
}: {
  title: string;
  icon?: React.ReactNode;
  tone?: "stone" | "emerald" | "amber" | "red" | "blue";
  bookings: Booking[];
  emptyText: string;
  onOpen: (b: Booking) => void;
}) {
  return (
    <div>
      <SectionHeading title={title} count={bookings.length} icon={icon} tone={tone} />
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
 * data model, aside from "+ New booking" which calls createWalkInBooking.
 * Two queries below (status==CONFIRMED + checkIn<today) need a Firestore
 * composite index — already deployed, see firestore.indexes.json.
 *
 * Layout: a main column (stat cards, the actionable sectioned lists, and the
 * full "every booking" ledger table) beside a sticky reservation calendar --
 * clicking a calendar date filters the ledger table to that day's arrivals.
 *
 * Deliberately left out (no data model for these yet, would need a new
 * module, not just a new screen): VIP flags, birthdays/anniversaries,
 * blacklist alerts, dirty/clean room counts, shift handover notes.
 */
export default function Dashboard({
  role,
  onGoToInHouse,
  onGoToEnquiries,
}: {
  role: StaffRole;
  /** In house has no list on this page (it's a full Queue tab) -- switches the app's top-level view there. */
  onGoToInHouse?: () => void;
  /** Open enquiries has no list here either -- switches to the Enquiries view. */
  onGoToEnquiries?: () => void;
}) {
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
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
  // Refund state lives in paymentStatus, independent of status -- a booking
  // sitting at REFUND_PENDING can otherwise vanish from every other section
  // once it's CANCELLED/CONFIRMED, with nothing on this page pointing to it.
  const { data: refundsPending } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("paymentStatus", "==", "REFUND_PENDING")),
    []
  );
  // No NO_SHOW status exists in this system — this is a read-only, client-side
  // view of "confirmed, arrival date already past, never checked in." It does
  // not change the booking's actual status.
  const { data: overdueArrivals } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("status", "==", "CONFIRMED"), where("checkIn", "<", today)),
    [today]
  );
  const { data: enquiries } = useCollection<Enquiry>(
    () => query(collection(db, "enquiries"), orderBy("createdAt", "desc")),
    []
  );
  const openEnquiries = enquiries.filter((e) => e.status !== "CLOSED").length;

  // Occupancy = in-house bookings / total pooled room inventory across active
  // categories. `RoomCategory.totalRooms` is the same pooled-count field the
  // booking/availability logic already treats as capacity per category (see
  // shared/src/types.ts) -- reusing it here rather than inventing a second
  // notion of "how many rooms exist." Read-only, purely for the dashboard's
  // occupancy ring; not a report and not persisted anywhere.
  const { data: activeCategories } = useCollection<RoomCategory>(
    () => query(collection(db, "roomCategories"), where("active", "==", true)),
    []
  );
  const totalRoomsCapacity = activeCategories.reduce((sum, c) => sum + (c.totalRooms || 0), 0);
  const occupancyPercent = totalRoomsCapacity > 0 ? Math.round((inHouse.length / totalRoomsCapacity) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">Today, {today}</p>
        <PrimaryButton onClick={() => setShowNewBooking(true)}>+ New booking</PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
        <StatCard
          label="Arrivals today"
          value={arrivals.length}
          icon={<IconArrival className="h-4 w-4" />}
          onClick={() => scrollToSection("arrivals-section")}
        />
        <StatCard
          label="Departures today"
          value={departures.length}
          icon={<IconDeparture className="h-4 w-4" />}
          onClick={() => scrollToSection("departures-section")}
        />
        <StatCard
          label="In house"
          value={inHouse.length}
          icon={<IconBed className="h-3.5 w-3.5" />}
          gaugePercent={totalRoomsCapacity > 0 ? occupancyPercent : undefined}
          caption={totalRoomsCapacity > 0 ? `${occupancyPercent}% of ${totalRoomsCapacity} rooms` : undefined}
          onClick={onGoToInHouse}
        />
        <StatCard
          label="Needs action"
          value={needsAction.length}
          tone={needsAction.length > 0 ? "amber" : undefined}
          icon={<IconAlert className="h-4 w-4" />}
          onClick={() => scrollToSection("needs-action-section")}
        />
        <StatCard
          label="Rejected receipts"
          value={rejectedReceipts.length}
          tone={rejectedReceipts.length > 0 ? "red" : undefined}
          icon={<IconReceiptX className="h-4 w-4" />}
          onClick={() => scrollToSection("rejected-receipts-section")}
        />
        <StatCard label="Open enquiries" value={openEnquiries} icon={<IconMail className="h-4 w-4" />} onClick={onGoToEnquiries} />
        <StatCard
          label="Refund pending"
          value={refundsPending.length}
          tone={refundsPending.length > 0 ? "red" : undefined}
          icon={<IconRefund className="h-4 w-4" />}
          onClick={() => scrollToSection("refunds-pending-section")}
        />
      </div>

      {overdueArrivals.length > 0 && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
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

      {/* Main content (left) + sticky reservation calendar (right). Calendar
          stays visible while the sections below scroll; on narrow windows it
          drops beneath everything instead of squeezing the main column. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          {overdueArrivals.length > 0 && (
            <BookingList
              title="Past arrival date, not checked in"
              tone="red"
              bookings={overdueArrivals}
              emptyText="None."
              onOpen={setSelected}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="arrivals-section">
              <BookingList
                title="Arrivals today"
                tone="emerald"
                icon={<IconArrival className="h-3.5 w-3.5" />}
                bookings={arrivals}
                emptyText="No arrivals today."
                onOpen={setSelected}
              />
            </div>
            <div id="departures-section">
              <BookingList
                title="Departures today"
                tone="blue"
                icon={<IconDeparture className="h-3.5 w-3.5" />}
                bookings={departures}
                emptyText="No departures today."
                onOpen={setSelected}
              />
            </div>
          </div>

          <div id="needs-action-section">
            <BookingList
              title="Needs front desk action"
              tone="amber"
              icon={<IconAlert className="h-3.5 w-3.5" />}
              bookings={needsAction}
              emptyText="Nothing pending."
              onOpen={setSelected}
            />
          </div>

          {/* Previously fetched for the stat card count but never actually shown
              anywhere -- there was no way to see which bookings these were. */}
          <div id="rejected-receipts-section">
            <BookingList
              title="Rejected receipts"
              tone="red"
              icon={<IconReceiptX className="h-3.5 w-3.5" />}
              bookings={rejectedReceipts}
              emptyText="No rejected receipts."
              onOpen={setSelected}
            />
          </div>

          <div id="refunds-pending-section">
            <BookingList
              title="Refunds pending"
              tone="red"
              icon={<IconRefund className="h-3.5 w-3.5" />}
              bookings={refundsPending}
              emptyText="No refunds pending."
              onOpen={setSelected}
            />
          </div>

          <BookingsTable filterDate={calendarDate} onOpen={setSelected} />
        </div>

        <div className="lg:sticky lg:top-6">
          <BookingCalendar selectedDate={calendarDate} onSelectDate={setCalendarDate} />
        </div>
      </div>

      {selected && (
        <BookingDrawer
          booking={selected}
          role={role}
          onClose={() => setSelected(null)}
          onActionDone={() => setSelected(null)}
        />
      )}

      {showNewBooking && (
        <NewBookingModal onClose={() => setShowNewBooking(false)} onCreated={(b) => setSelected(b)} />
      )}
    </div>
  );
}
