import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRoomCategories } from "@/lib/data";
import type { RoomCategory } from "@wellness-lodge/shared";
import { SectionHeading, Card, SampleTag } from "@/components/ui";

const HIGHLIGHTS = [
  { title: "Comfortable rooms", body: "Restful rooms with modern amenities, set in calm surroundings." },
  { title: "Car rental", body: "Sedans, SUVs and vans available for airport transfers and touring." },
  { title: "Function hall & events", body: "Weddings, conferences and celebrations, catered end to end." },
  { title: "Restaurant & cafe", body: "Fresh local menus for guests and event catering." },
];

const STEPS = [
  { n: "1", title: "Choose your dates & room", body: "Browse rooms and rates, then check live availability." },
  { n: "2", title: "Pick how you'll pay", body: "Bank transfer with a receipt upload, or pay at the front desk." },
  { n: "3", title: "Get your booking reference", body: "Your stay is confirmed once the desk verifies payment." },
];

export default function Home() {
  const [rooms, setRooms] = useState<RoomCategory[] | null>(null);

  useEffect(() => {
    fetchRoomCategories()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  return (
    <div>
      <section className="border-b border-stone-200 bg-gradient-to-b from-emerald-50 to-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <SampleTag />
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Rest. Recharge. Reconnect.
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              Wellness Lodge is a comfortable stay in Papua New Guinea with car rental, a function
              hall for weddings and events, and a restaurant &amp; cafe on site. Book direct — pay
              by bank transfer or at the front desk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Check availability &amp; book
              </Link>
              <Link
                to="/rooms"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                View rooms &amp; rates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="What we offer" title="Everything for your stay and your event" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} className="p-5">
              <p className="font-semibold text-stone-900">{h.title}</p>
              <p className="mt-1.5 text-sm text-stone-600">{h.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Rooms & rates" title="Popular room types" subtitle="All rates in PGK (Kina), per night." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(rooms ?? []).slice(0, 4).map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-emerald-50 text-emerald-700 text-xs font-medium">
                  Photo pending
                </div>
                <div className="p-4">
                  <p className="font-semibold text-stone-900">{r.name}</p>
                  <p className="mt-1 text-xs text-stone-500">Sleeps up to {r.maxOccupancy}</p>
                  <Link to="/rooms" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    View rates &rarr;
                  </Link>
                </div>
              </Card>
            ))}
            {rooms === null &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-100" />
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <SectionHeading eyebrow="How it works" title="Book your stay in three steps" />
        <div className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {s.n}
              </p>
              <div>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-stone-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
