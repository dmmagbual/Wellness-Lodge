import { Link } from "react-router-dom";
import { SectionHeading, Card } from "@/components/ui";
import PhotoImg from "@/components/PhotoImg";
import { HERO_IMAGES } from "@/lib/media";

const SERVICES = [
  {
    href: "/car-rental",
    title: "Car Rental",
    body: "Sedans, SUVs and vans for airport transfers, touring and self-drive hire.",
    image: HERO_IMAGES.carRental,
  },
  {
    href: "/function-hall",
    title: "Function Hall & Events",
    body: "Weddings, conferences and celebrations, catered end to end by our events team.",
    image: HERO_IMAGES.functionHall,
  },
  {
    href: "/restaurant-cafe",
    title: "Restaurant & Cafe",
    body: "Fresh local menus for guests, walk-ins and event catering, on site.",
    image: HERO_IMAGES.restaurant,
  },
];

export default function Services() {
  return (
    <div>
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img src={HERO_IMAGES.services} alt="Wellness Lodge grounds" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          eyebrow="Beyond your stay"
          title="Services"
          subtitle="Everything Wellness Lodge offers alongside your room, in one place."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.href} className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
              <PhotoImg src={s.image} alt={s.title} ratio="aspect-[4/3]" imgClassName="transition duration-500 group-hover:scale-105" />
              <div className="p-6">
                <p className="font-serif text-xl font-semibold text-stone-900">{s.title}</p>
                <p className="mt-2 text-sm text-stone-600">{s.body}</p>
                <Link
                  to={s.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Learn more
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
