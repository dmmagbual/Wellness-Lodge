import { useEffect, useState } from "react";
import { fetchCarRentalFleet } from "@/lib/data";
import type { CarRentalVehicle } from "@wellness-lodge/shared";
import { formatPGK } from "@wellness-lodge/shared";
import { Card, Pill, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";

export default function CarRental() {
  const [fleet, setFleet] = useState<CarRentalVehicle[]>([]);

  useEffect(() => {
    fetchCarRentalFleet().then(setFleet).catch(() => setFleet([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Getting around"
        title="Car Rental"
        subtitle="Airport transfers, touring and self-drive hire. Enquire below to check vehicle availability for your dates."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {fleet.map((v) => (
          <Card key={v.id} className="overflow-hidden">
            <div className="flex h-32 items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700">
              Photo pending
            </div>
            <div className="p-5">
              <p className="font-semibold text-stone-900">{v.name}</p>
              <p className="text-xs text-stone-500">
                {v.category} &middot; {v.seats} seats &middot; {v.transmission === "AUTOMATIC" ? "Automatic" : "Manual"}
              </p>
              <p className="mt-3 text-lg font-bold text-stone-900">{formatPGK(v.dailyRateToea)}<span className="ml-1 text-sm font-normal text-stone-500">/ day</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.inclusions.map((i) => (
                  <Pill key={i}>{i}</Pill>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-500">Requirements: {v.requirements.join(", ")}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 max-w-2xl">
        <EnquiryForm type="CAR_RENTAL" title="Request a vehicle" />
      </div>
    </div>
  );
}
