import { useEffect, useState } from "react";
import { fetchFunctionHallPackages } from "@/lib/data";
import type { FunctionHallPackage } from "@wellness-lodge/shared";
import { formatPGK } from "@wellness-lodge/shared";
import { Card, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";

export default function FunctionHall() {
  const [packages, setPackages] = useState<FunctionHallPackage[]>([]);

  useEffect(() => {
    fetchFunctionHallPackages().then(setPackages).catch(() => setPackages([]));
  }, []);

  return (
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
            <div className="flex h-40 items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700">
              Photo pending
            </div>
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
  );
}
