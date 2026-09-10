import { useEffect, useState } from "react";
import { fetchSettings } from "@/lib/data";
import type { LodgeSettings } from "@wellness-lodge/shared";
import { Card, SectionHeading, SampleTag } from "@/components/ui";

const FAQ = [
  {
    q: "How do I pay for my booking?",
    a: "By bank transfer (upload your receipt after transferring) or by paying at the front desk on arrival, within the hold period shown on your booking.",
  },
  {
    q: "When is my room confirmed?",
    a: "Only once the front desk verifies your payment — a submitted receipt or a pay-at-desk request is not itself a confirmed booking.",
  },
  {
    q: "What happens if I don't pay in time?",
    a: "Pay-at-desk holds and bank-transfer receipt deadlines both expire automatically, and the room is released back for other guests.",
  },
];

export default function Policies() {
  const [settings, setSettings] = useState<Partial<LodgeSettings> | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHeading eyebrow="Good to know" title="Policies & FAQ" />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">Cancellation policy</h3>
          <p className="mt-2 text-sm text-stone-600">
            {settings?.cancellationPolicy ?? "To be confirmed by lodge management."}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">Privacy notice</h3>
          <p className="mt-2 text-sm text-stone-600">
            {settings?.privacyNotice ?? "To be confirmed by lodge management."}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">Frequently asked questions</h3>
          <div className="mt-3 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="font-medium text-stone-900">{f.q}</p>
                <p className="mt-1 text-sm text-stone-600">{f.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
