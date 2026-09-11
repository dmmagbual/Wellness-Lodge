import { useMemo, useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { Booking } from "@wellness-lodge/shared";
import { Card, EmptyState, inputClass } from "@/components/ui";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/**
 * Monthly report of paid reservations — every booking whose payment has been
 * verified by front desk (paymentStatus VERIFIED), grouped by the month it
 * was CONFIRMED in (not the month of the stay). Read-only, client-side
 * grouping of the existing `bookings` collection — no new Cloud Function.
 *
 * Needs one new Firestore composite index (paymentStatus ASC, confirmedAt
 * DESC) — see firestore.indexes.json and the handover message.
 *
 * Deliberately NOT built (see handover message): occupancy %/ADR/RevPAR,
 * booking-source breakdown as a chart, CSV/PDF export, multi-month trend —
 * this is the single "paid bookings this month" report that was asked for,
 * not a full revenue-management report suite.
 */
export default function Reports() {
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const { data: paidBookings, loading } = useCollection<Booking>(
    () => query(collection(db, "bookings"), where("paymentStatus", "==", "VERIFIED"), orderBy("confirmedAt", "desc")),
    []
  );

  const monthly = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of paidBookings) {
      if (!b.confirmedAt) continue;
      const key = b.confirmedAt.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [paidBookings]);

  const months = useMemo(() => Array.from(monthly.keys()).sort().reverse(), [monthly]);
  const rows = monthly.get(month) ?? [];

  const totals = rows.reduce(
    (acc, b) => {
      acc.deposit += b.price.depositToea;
      acc.balance += b.price.balanceToea;
      acc.total += b.price.totalToea;
      return acc;
    },
    { deposit: 0, balance: 0, total: 0 }
  );

  return (
    <div className="p-6">
      <Card className="p-4">
        <p className="text-sm text-stone-600">
          Every booking whose payment front desk has verified, grouped by the month it was <em>confirmed</em> — not
          the month of the stay. "Collected" is the deposit guests were asked to pay at booking; the balance is still
          due at check-in and is shown separately so it's never counted as revenue already received.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm font-medium text-stone-700">Month</label>
          <select className={`${inputClass} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.length === 0 && <option value={month}>{monthLabel(month)}</option>}
            {!months.includes(month) && months.length > 0 && <option value={month}>{monthLabel(month)}</option>}
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Paid bookings</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Collected (deposits)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{formatPGK(totals.deposit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Balance due at check-in</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{formatPGK(totals.balance)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total booking value</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatPGK(totals.total)}</p>
        </Card>
      </div>

      <Card className="mt-5 overflow-x-auto">
        {loading && <p className="p-4 text-sm text-stone-500">Loading…</p>}
        {!loading && rows.length === 0 && <EmptyState>No paid bookings confirmed in this month.</EmptyState>}
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-2">Confirmed</th>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Guest</th>
                <th className="px-4 py-2">Room type</th>
                <th className="px-4 py-2">Stay</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2 text-right">Deposit</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-stone-100 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2 text-stone-500">
                    {b.confirmedAt ? new Date(b.confirmedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 font-medium text-stone-900">{b.bookingRef}</td>
                  <td className="px-4 py-2">{b.guest.name}</td>
                  <td className="px-4 py-2">{b.price.categoryName}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-stone-600">
                    {b.checkIn} → {b.checkOut}
                  </td>
                  <td className="px-4 py-2 text-stone-500">{b.source.replaceAll("_", " ")}</td>
                  <td className="px-4 py-2 text-right">{formatPGK(b.price.depositToea)}</td>
                  <td className="px-4 py-2 text-right text-stone-500">{formatPGK(b.price.balanceToea)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatPGK(b.price.totalToea)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
