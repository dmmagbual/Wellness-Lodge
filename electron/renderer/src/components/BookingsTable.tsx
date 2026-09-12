import { collection, query, orderBy, limit as fsLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { Booking } from "@wellness-lodge/shared";
import { Badge, Card, EmptyState, PaymentStatusFlag, SectionHeading } from "@/components/ui";
import { IconCalendar } from "@/components/icons";

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

/**
 * Master "every booking" table — every row shows its lifecycle status AND
 * its payment/refund state as its own dedicated column (not a note beside
 * the reference), so a refunded or cancelled booking is exactly as visible
 * here as a live one. `filterDate`, driven by the calendar beside it,
 * narrows this to bookings arriving that day; cleared it shows everything.
 *
 * Ordered by checkIn (not createdAt) since this is meant to be browsed like
 * a reservation ledger. Capped at 500 -- generous for a boutique lodge's
 * volume without an unbounded read; Queue's own search tab remains the tool
 * for finding one specific booking by name/phone/email.
 */
export default function BookingsTable({
  filterDate,
  onOpen,
}: {
  filterDate: string | null;
  onOpen: (b: Booking) => void;
}) {
  const { data: all } = useCollection<Booking>(
    () => query(collection(db, "bookings"), orderBy("checkIn", "desc"), fsLimit(500)),
    []
  );

  const rows = filterDate ? all.filter((b) => b.checkIn === filterDate) : all;

  return (
    <div>
      <SectionHeading
        icon={<IconCalendar className="h-4 w-4" />}
        tone="emerald"
        title={filterDate ? `Bookings arriving ${filterDate}` : "All bookings"}
        count={rows.length}
      />
      <Card className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState>{filterDate ? "No arrivals on this date." : "No bookings yet."}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Guest</th>
                <th className="px-4 py-2.5 font-medium">Room</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => onOpen(b)}
                  className="cursor-pointer border-b border-stone-50 last:border-b-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-2.5 font-medium text-stone-900">{b.bookingRef}</td>
                  <td className="px-4 py-2.5 text-stone-700">{b.guest.name}</td>
                  <td className="px-4 py-2.5 text-stone-600">{b.price.categoryName}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone-500">
                    {b.checkIn} → {b.checkOut}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-stone-900">{formatPGK(b.price.totalToea)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={STATUS_TONE[b.status] ?? "stone"}>{b.status.replace(/_/g, " ")}</Badge>
                      <PaymentStatusFlag paymentStatus={b.paymentStatus} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
