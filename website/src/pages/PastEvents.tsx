import { useEffect, useState } from "react";
import { fetchPastEvents } from "@/lib/data";
import type { PastEvent } from "@wellness-lodge/shared";
import { Card, Pill, SectionHeading, SampleTag } from "@/components/ui";

export default function PastEvents() {
  const [events, setEvents] = useState<PastEvent[]>([]);

  useEffect(() => {
    fetchPastEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Gallery"
        title="Past Events"
        subtitle="A look at weddings, conferences and celebrations hosted at Wellness Lodge."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <div className="flex h-40 items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700">
              Photo pending
            </div>
            <div className="p-4">
              <Pill>{e.category}</Pill>
              <p className="mt-2 font-semibold text-stone-900">{e.title}</p>
              <p className="text-xs text-stone-500">{e.eventDate}</p>
              <p className="mt-1 text-sm text-stone-600">{e.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <p className="mt-10 text-center text-stone-500">
          Photos are published here once the lodge confirms permission to use them (name, faces and captions
          approved in writing).
        </p>
      )}
    </div>
  );
}
