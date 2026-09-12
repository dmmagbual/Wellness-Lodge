import { useEffect, useState } from "react";
import { fetchFunctionHallPackages } from "@/lib/data";
import type { FunctionHallPackage } from "@wellness-lodge/shared";
import { formatPGK } from "@wellness-lodge/shared";
import { Card, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";
import PhotoImg from "@/components/PhotoImg";
import { HERO_IMAGES, HALL_IMAGES, HALL_IMAGE_FALLBACK } from "@/lib/media";

export default function FunctionHall() {
  const [packages, setPackages] = useState<FunctionHallPackage[]>([]);

  useEffect(() => {
    fetchFunctionHallPackages().then(setPackages).catch(() => setPackages([]));
  }, []);

  return (
    <div>
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img src={HERO_IMAGES.functionHall} alt="Function hall set up for an event" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Weddings, conferences & celebrations"
        title="Function Hall & Events"
        subtitle="Our function hall hosts weddings, birthdays, conferences and community events. Send an enquiry and our events coordinator will follow up with a quotation."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {packages.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <PhotoImg src={HALL_IMAGES[p.id] ?? HALL_IMAGE_FALLBACK} alt={p.name} ratio="aspect-[16/9]" />
            <div className="p-5">
              <p className="font-semibold text-stone-900">{p.name}</p>
              <p className="text-xs text-stone-500">
                Up to {p.capacitySeated} seated &middot; {p.capacityStanding} standing
              </p>
              <p className="mt-3 text-lg font-bold text-stone-900">
                From {formatPGK(p.priceFromToea)}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-stone-600">
                {p.inclusions.map((i) => (
                  <li key={i}>&bull; {i}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 max-w-2xl">
        <EnquiryForm type="FUNCTION_HALL" title="Request a quotation" />
      </div>
    </div>
    </div>
  );
}
