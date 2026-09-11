import { Link } from "react-router-dom";
import { SectionHeading, Card } from "@/components/ui";

const SERVICES = [
  {
    href: "/car-rental",
    title: "Car Rental",
    body: "Sedans, SUVs and vans for airport transfers, touring and self-drive hire.",
  },
  {
    href: "/function-hall",
    title: "Function Hall & Events",
    body: "Weddings, conferences and celebrations, catered end to end by our events team.",
  },
  {
    href: "/restaurant-cafe",
    title: "Restaurant & Cafe",
    body: "Fresh local menus for guests, walk-ins and event catering, on site.",
  },
];

export default function Services() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Beyond your stay"
        title="Services"
        subtitle="Everything Wellness Lodge offers alongside your room, in one place."
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Card key={s.href} className="p-6">
            <p className="font-serif text-xl font-semibold text-stone-900">{s.title}</p>
            <p className="mt-2 text-sm text-stone-600">{s.body}</p>
            <Link
              to={s.href}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Learn more &rarr;
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
