import { useEffect, useState } from "react";
import { fetchPastEvents } from "@/lib/data";
import type { PastEvent } from "@wellness-lodge/shared";
import { Card, Pill, SampleTag } from "@/components/ui";
import PhotoImg from "@/components/PhotoImg";
import Gallery from "@/components/Gallery";
import { HERO_IMAGES, PAST_EVENT_IMAGES, PAST_EVENT_FALLBACK } from "@/lib/media";

export default function PastEvents() {
  const [events, setEvents] = useState<PastEvent[]>([]);

  useEffect(() => {
    fetchPastEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <div>
      <div className="relative h-[60vh] min-h-[420px] max-h-[680px] overflow-hidden bg-[#06170f] sm:h-[72vh]">
        <img
          src={HERO_IMAGES.pastEvents}
          alt="Wedding reception at Wellness Lodge"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 text-center text-white">
          <p className="text-xs font-semibold tracking-wide uppercase text-emerald-200">Gallery</p>
          <h1 className="mt-1 font-serif text-3xl font-bold sm:text-5xl">Past Events</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="mx-auto max-w-xl text-center text-stone-600">
          A look at weddings, conferences and celebrations hosted at Wellness Lodge.
        </p>
        <div className="mt-3 flex justify-center">
          <SampleTag />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const photos = PAST_EVENT_IMAGES[e.id] ?? [PAST_EVENT_FALLBACK];
            return (
              <Card key={e.id} className="overflow-hidden">
                <PhotoImg src={photos[0]} alt={e.title} ratio="aspect-[4/3]" />
                <div className="p-4">
                  <Pill>{e.category}</Pill>
                  <p className="mt-2 font-semibold text-stone-900">{e.title}</p>
                  <p className="text-xs text-stone-500">{e.eventDate}</p>
                  <p className="mt-1 text-sm text-stone-600">{e.description}</p>
                  {photos.length > 1 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                        View all {photos.length} photos
                      </summary>
                      <div className="mt-3">
                        <Gallery images={photos} altPrefix={e.title} className="sm:grid-cols-3" />
                      </div>
                    </details>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {events.length === 0 && (
          <p className="mt-10 text-center text-stone-500">
            Photos are published here once the lodge confirms permission to use them (name, faces and captions
            approved in writing).
          </p>
        )}
      </div>
    </div>
  );
}
