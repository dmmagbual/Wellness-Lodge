import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRoomCategories } from "@/lib/data";
import type { RoomCategory } from "@wellness-lodge/shared";
import { SectionHeading, Card, SampleTag } from "@/components/ui";
import LeafBranch from "@/components/LeafBranch";
import PhotoImg from "@/components/PhotoImg";
import Reveal from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";
import Testimonials from "@/components/Testimonials";
import { HERO_IMAGES, ROOM_IMAGES, ROOM_IMAGE_FALLBACK, GALLERY_STRIP } from "@/lib/media";

const HIGHLIGHTS = [
  {
    title: "Comfortable rooms",
    body: "Restful rooms with modern amenities, set in calm surroundings.",
    icon: (
      <path d="M3 20v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 13V8a2 2 0 0 1 2-2h4v7M14 6h4a2 2 0 0 1 2 2v5M3 20h18" />
    ),
  },
  {
    title: "Car rental",
    body: "Sedans, SUVs and vans available for airport transfers and touring.",
    icon: <path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 17V11l2-5h10l4 5v6" />,
  },
  {
    title: "Function hall & events",
    body: "Weddings, conferences and celebrations, catered end to end.",
    icon: <path d="M4 21V9l8-6 8 6v12M9 21v-6h6v6" />,
  },
  {
    title: "Restaurant & cafe",
    body: "Fresh local menus for guests and event catering.",
    icon: <path d="M6 2v7a3 3 0 0 0 6 0V2M9 9v13M18 2v9a3 3 0 0 1-3 3M18 2c1.7 0 3 2 3 4.5S19.7 11 18 11" />,
  },
];

const STEPS = [
  { n: "1", title: "Choose your dates & room", body: "Browse rooms and rates, then check live availability." },
  { n: "2", title: "Pick how you'll pay", body: "Bank transfer with a receipt upload, or pay at the front desk." },
  { n: "3", title: "Get your booking reference", body: "Your stay is confirmed once the desk verifies payment." },
];

const STATS = [
  { value: 18, suffix: "", label: "Room categories & suites" },
  { value: 4.9, suffix: "★", label: "Average guest rating" },
  { value: 3200, suffix: "+", label: "Guests hosted" },
  { value: 12, suffix: " yrs", label: "Serving Papua New Guinea" },
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
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-[#06170f] text-white">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.homeHero}
            alt=""
            aria-hidden="true"
            className="animate-kenburns h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#06170f]/95 via-[#0a2318]/85 to-[#0d2b1c]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06170f] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200 uppercase backdrop-blur">
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
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 hover:shadow-emerald-500/20"
              >
                Reserve Your Stay
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/rooms"
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Explore Rooms
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl md:min-h-[420px]">
              <img
                src={HERO_IMAGES.homeSecondary}
                alt="Lounge deck at Wellness Lodge"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-emerald-950/10" />
              <LeafBranch className="pointer-events-none absolute top-0 right-4 h-full w-40 opacity-60 md:w-48" />
              <div className="relative flex h-full min-h-[420px] flex-col justify-end p-8 pt-40">
                <blockquote className="max-w-[75%] font-serif text-lg leading-snug text-white italic md:text-xl">
                  &ldquo;Where quiet becomes part of the stay.&rdquo;
                </blockquote>
                <p className="mt-3 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                  — The Wellness Lodge Promise
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Highlights */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="What we offer" title="Everything for your stay and your event" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={i * 80}>
              <Card className="group h-full p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {h.icon}
                  </svg>
                </span>
                <p className="mt-3 font-semibold text-stone-900">{h.title}</p>
                <p className="mt-1.5 text-sm text-stone-600">{h.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Rooms showcase */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Rooms & rates" title="Popular room types" subtitle="All rates in PGK (Kina), per night." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(rooms ?? []).slice(0, 4).map((r, i) => (
              <Reveal key={r.id} delay={i * 90}>
                <Card className="group h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative">
                    <PhotoImg
                      src={ROOM_IMAGES[r.slug]?.[0] ?? ROOM_IMAGE_FALLBACK}
                      alt={r.name}
                      ratio="aspect-[4/3]"
                      imgClassName="transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-stone-700 backdrop-blur">
                      Sleeps {r.maxOccupancy}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-stone-900">{r.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500">{r.description}</p>
                    <Link
                      to="/rooms"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View rates
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </Card>
              </Reveal>
            ))}
            {rooms === null &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-100" />
              ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Gallery teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="A closer look" title="Life at Wellness Lodge" />
        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {GALLERY_STRIP.map((src, i) => (
            <Reveal key={src + i} delay={i * 60}>
              <Link to="/past-events" className="block h-full">
                <PhotoImg src={src} alt="Wellness Lodge" ratio="aspect-square" className="rounded-xl transition hover:opacity-90" />
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/past-events" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            See the full gallery &rarr;
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Testimonials */}
      <section className="border-y border-stone-200 bg-stone-50/70 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading eyebrow="Guest stories" title="What guests are saying" />
          <div className="mt-10">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- How it works */}
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

      {/* ---------------------------------------------------------------- Final CTA */}
      <section className="relative overflow-hidden bg-[#06170f] py-20 text-white">
        <img src={HERO_IMAGES.homeSecondary} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06170f] via-[#06170f]/90 to-[#0d2b1c]/70" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Ready to experience it yourself?</h2>
          <p className="mt-3 text-emerald-100/80">Check live availability and reserve your room in minutes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/book"
              className="rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400"
            >
              Reserve Your Stay
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to the front desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
