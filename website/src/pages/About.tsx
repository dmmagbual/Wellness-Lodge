import { SectionHeading, Card, SampleTag } from "@/components/ui";

const FACILITIES = [
  "Free Wi-Fi throughout the property",
  "On-site parking",
  "Restaurant and cafe",
  "Function hall for events",
  "Car rental desk",
  "24-hour front desk",
  "Airport transfer on request",
  "Laundry service",
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SectionHeading eyebrow="Our story" title="About Wellness Lodge" />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>
      <div className="mt-8 space-y-4 text-stone-700">
        <p>
          PLACEHOLDER — replace with the lodge's approved history, year established, and description
          once supplied (Final Client Submission Package, checklist item 2 — "Business profile and brand").
        </p>
        <p>
          Wellness Lodge offers comfortable rooms, car rental, a function hall for weddings and
          events, and an on-site restaurant and cafe — all in one place in Papua New Guinea.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-stone-900">Facilities & Amenities</h2>
        <Card className="mt-4 p-5">
          <ul className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
            {FACILITIES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Sample list — confirm against the lodge's actual facilities.</p>
        </Card>
      </div>
    </div>
  );
}
