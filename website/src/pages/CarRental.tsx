import { useEffect, useState } from "react";
import { fetchCarRentalFleet } from "@/lib/data";
import type { CarRentalVehicle } from "@wellness-lodge/shared";
import { formatPGK } from "@wellness-lodge/shared";
import { Card, Pill, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";
import PhotoImg from "@/components/PhotoImg";
import { HERO_IMAGES, VEHICLE_IMAGES, VEHICLE_IMAGE_FALLBACK } from "@/lib/media";

export default function CarRental() {
  const [fleet, setFleet] = useState<CarRentalVehicle[]>([]);

  useEffect(() => {
    fetchCarRentalFleet().then(setFleet).catch(() => setFleet([]));
  }, []);

  return (
    <div>
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img src={HERO_IMAGES.carRental} alt="Car rental at Wellness Lodge" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>
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
            <PhotoImg src={VEHICLE_IMAGES[v.id] ?? VEHICLE_IMAGE_FALLBACK} alt={v.name} ratio="aspect-[4/3]" />
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
    </div>
  );
}
