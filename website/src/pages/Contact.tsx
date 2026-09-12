import { useEffect, useState } from "react";
import { fetchSettings } from "@/lib/data";
import type { LodgeSettings } from "@wellness-lodge/shared";
import { Card, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";
import { HERO_IMAGES } from "@/lib/media";

export default function Contact() {
  const [settings, setSettings] = useState<Partial<LodgeSettings> | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  return (
    <div>
      <div className="relative h-44 overflow-hidden sm:h-56">
        <img src={HERO_IMAGES.contact} alt="Wellness Lodge" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SectionHeading eyebrow="Get in touch" title="Contact" />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">Lodge details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-stone-500">Address</dt>
              <dd className="font-medium text-stone-900">
                {settings?.address && settings.address !== "TO BE CONFIRMED — Papua New Guinea"
                  ? settings.address
                  : "Sample Address, Port Moresby, National Capital District, Papua New Guinea"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Phone</dt>
              <dd className="font-medium text-stone-900">
                {settings?.phone && settings.phone !== "TO BE CONFIRMED" ? settings.phone : "+675 325 0000"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Reservations</dt>
              <dd className="font-medium text-stone-900">
                {settings?.reservationsEmail ?? "reservations@wellnesslodge.example"} &middot;{" "}
                {settings?.reservationsPhone && settings.reservationsPhone !== "TO BE CONFIRMED"
                  ? settings.reservationsPhone
                  : "+675 325 0001"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Check-in / Check-out</dt>
              <dd className="font-medium text-stone-900">
                {settings?.checkInTime ?? "—"} / {settings?.checkOutTime ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>
        <EnquiryForm type="GENERAL" title="Send a message" />
      </div>
    </div>
    </div>
  );
}
