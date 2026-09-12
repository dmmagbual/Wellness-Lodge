import { useEffect, useMemo, useRef } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { todayStr } from "@wellness-lodge/shared";
import type { Booking } from "@wellness-lodge/shared";
import { Card } from "@/components/ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Days in a single month grid, padded with leading/trailing blanks so weekdays line up. */
function buildMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = first.getDay();
  const cells: (string | null)[] = Array(leadingBlanks).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toDateStr(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Multi-month reservation calendar for the Dashboard's right rail. Shows one
 * month per block, stacked in a vertically scrolling column (previous month
 * through 11 months out — well past the "at least three months" ask, with
 * the rest reachable by scrolling), each day dotted by how many bookings
 * ARRIVE that day. Clicking a date filters the bookings table beside it;
 * clicking the same date again clears the filter.
 */
export default function BookingCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const today = todayStr();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLDivElement>(null);

  const { rangeStart, rangeEnd, months } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);
    const list: { year: number; month: number }[] = [];
    for (let i = -1; i <= 11; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return { rangeStart: toDateStr(start), rangeEnd: toDateStr(end), months: list };
  }, []);

  // Single range query across the whole visible span -- checkIn is both the
  // filter and the sort field, so this needs no composite index.
  const { data: bookings } = useCollection<Booking>(
    () =>
      query(
        collection(db, "bookings"),
        where("checkIn", ">=", rangeStart),
        where("checkIn", "<=", rangeEnd),
        orderBy("checkIn", "asc")
      ),
    [rangeStart, rangeEnd]
  );

  const arrivalsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.checkIn, (map.get(b.checkIn) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  // Land on the current month by default rather than the top of a 13-month list.
  useEffect(() => {
    currentMonthRef.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-[15px] font-semibold text-stone-900">Reservation calendar</p>
        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
          >
            Clear date ✕
          </button>
        )}
      </div>

      <div ref={containerRef} className="max-h-[620px] flex-1 space-y-5 overflow-y-auto pr-1">
        {months.map(({ year, month }) => {
          const isCurrent = year === new Date().getFullYear() && month === new Date().getMonth();
          const cells = buildMonthGrid(year, month);
          return (
            <div key={`${year}-${month}`} ref={isCurrent ? currentMonthRef : undefined}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                {monthLabel(year, month)}
              </p>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAYS.map((w, i) => (
                  <span key={i} className="text-[10px] font-medium text-stone-400">
                    {w}
                  </span>
                ))}
                {cells.map((dateStr, i) => {
                  if (!dateStr) return <span key={i} />;
                  const count = arrivalsByDate.get(dateStr) ?? 0;
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const day = Number(dateStr.slice(-2));
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectDate(isSelected ? null : dateStr)}
                      className={`relative mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-full text-xs transition ${
                        isSelected
                          ? "bg-emerald-800 font-semibold text-white"
                          : isToday
                            ? "font-semibold text-brass-700 ring-1 ring-brass-400"
                            : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {day}
                      {count > 0 && (
                        <span
                          className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                            isSelected ? "bg-white" : "bg-brass-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 border-t border-stone-100 pt-2 text-[11px] text-stone-400">
        Dot = arrivals that day. Click a date to filter the table.
      </p>
    </Card>
  );
}
