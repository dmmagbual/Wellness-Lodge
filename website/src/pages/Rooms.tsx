import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRoomCategories, fetchRatePeriods } from "@/lib/data";
import type { RoomCategory, RatePeriod } from "@wellness-lodge/shared";
import { formatPGK, todayStr } from "@wellness-lodge/shared";
import { Card, Pill, SectionHeading, SampleTag } from "@/components/ui";

export default function Rooms() {
  const [rooms, setRooms] = useState<RoomCategory[]>([]);
  const [rates, setRates] = useState<Record<string, RatePeriod[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cats = await fetchRoomCategories();
      setRooms(cats);
      const entries = await Promise.all(cats.map(async (c) => [c.id, await fetchRatePeriods(c.id)] as const));
      setRates(Object.fromEntries(entries));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  function todaysRate(categoryId: string): number | null {
    const periods = rates[categoryId] ?? [];
    const today = todayStr();
    const p = periods.find((r) => r.startDate <= today && today <= r.endDate);
    return p ? p.nightlyRateToea : null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Accommodation"
        title="Rooms & Rates"
        subtitle="All rates shown in PGK (Kina), per night. Final photos and descriptions pending lodge-approved content."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      {loading && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const rate = todaysRate(room.id);
          return (
            <Card key={room.id} className="flex flex-col overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-emerald-50 text-sm font-medium text-emerald-700">
                Photo pending
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-stone-900">{room.name}</h3>
                <p className="mt-1 text-sm text-stone-600">{room.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {room.amenities.slice(0, 4).map((a) => (
                    <Pill key={a}>{a}</Pill>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                  <span>
                    Sleeps up to {room.maxOccupancy} &middot; {room.bedType}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div>
                    {rate !== null ? (
                      <>
                        <span className="text-xl font-bold text-stone-900">{formatPGK(rate)}</span>
                        <span className="ml-1 text-sm text-stone-500">/ night</span>
                      </>
                    ) : (
                      <span className="text-sm text-stone-500">Rate on request</span>
                    )}
                  </div>
                  <Link
                    to={`/book?category=${room.id}`}
                    className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Check dates
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && rooms.length === 0 && (
        <p className="mt-10 text-center text-stone-500">
          No rooms are published yet. Seed the demo data (see the README) or add rooms in the admin app.
        </p>
      )}
    </div>
  );
}
