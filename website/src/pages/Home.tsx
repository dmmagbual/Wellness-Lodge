import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRoomCategories } from "@/lib/data";
import type { RoomCategory } from "@wellness-lodge/shared";
import { SectionHeading, Card, SampleTag } from "@/components/ui";
import LeafBranch from "@/components/LeafBranch";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#06170f] via-[#0a2318] to-[#0d2b1c] text-white">
        {/* Soft ambient glows — purely decorative */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200 uppercase">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Papua New Guinea
            </span>
            <div className="mt-3">
              <SampleTag />
            </div>

            <h1 className="mt-4 font-serif text-4xl leading-[1.1] font-bold tracking-tight text-white md:text-5xl lg:text-[3.2rem]">
              Return to what rest feels like.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-emerald-100/80">
              Wellness Lodge is a boutique stay with comfortable rooms, car rental, a function hall
              for weddings and events, and a restaurant &amp; cafe on site. Book direct — pay by
              bank transfer or at the front desk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Reserve Your Stay
              </Link>
              <Link
                to="/rooms"
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Rooms
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 p-8 shadow-2xl md:min-h-[420px]">
              <LeafBranch className="pointer-events-none absolute top-0 right-4 h-full w-40 opacity-90 md:w-48" />
              <div className="relative flex h-full flex-col justify-end pt-40 md:pt-0">
                <blockquote className="max-w-[70%] font-serif text-lg leading-snug text-white italic md:text-xl">
                  &ldquo;Where quiet becomes part of the stay.&rdquo;
                </blockquote>
                <p className="mt-3 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                  — The Wellness Lodge Promise
                </p>
              </div>
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
