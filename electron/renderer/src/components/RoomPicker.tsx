import { useState } from "react";
import { formatPGK } from "@wellness-lodge/shared";
import type { RatePeriod, RoomCategory } from "@wellness-lodge/shared";
import RoomThumb from "@/components/RoomThumb";
import RoomPhotoLightbox from "@/components/RoomPhotoLightbox";

function cheapestNightlyRate(categoryId: string, ratePeriods: RatePeriod[]): number | null {
  const active = ratePeriods.filter((r) => r.categoryId === categoryId && r.active);
  if (active.length === 0) return null;
  return Math.min(...active.map((r) => r.nightlyRateToea));
}

/**
 * Visual room-type picker for the front desk's "New booking" flow --
 * replaces a plain <select> with photo cards (bed type, capacity,
 * amenities, indicative nightly rate) so staff can show a walk-in guest
 * what they're choosing between, the same way the public website does.
 * Purely a selection UI: the authoritative price is still computed
 * server-side in createWalkInBooking when the booking is actually created.
 */
export default function RoomPicker({
  categories,
  ratePeriods,
  value,
  onChange,
}: {
  categories: RoomCategory[];
  ratePeriods: RatePeriod[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; title: string } | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((c) => {
          const selected = c.id === value;
          const from = cheapestNightlyRate(c.id, ratePeriods);
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white text-left transition ${
                selected ? "border-emerald-700 ring-2 ring-emerald-700/40" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <div
                onClick={(e) => {
                  if (c.images?.length) {
                    e.stopPropagation();
                    setLightbox({ images: c.images, index: 0, title: c.name });
                  }
                }}
              >
                <RoomThumb images={c.images} size="lg" className="rounded-none" />
              </div>
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-xs text-white shadow">
                  ✓
                </span>
              )}
              <div className="p-3">
                <p className="font-display text-sm font-semibold text-stone-900">{c.name}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {c.bedType} · Sleeps {c.maxOccupancy}
                  {c.sizeSqm ? ` · ${c.sizeSqm} m²` : ""}
                </p>
                {c.amenities?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {c.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                        {a}
                      </span>
                    ))}
                    {c.amenities.length > 3 && (
                      <span className="text-[11px] text-stone-400">+{c.amenities.length - 3} more</span>
                    )}
                  </div>
                )}
                {from !== null && (
                  <p className="mt-2 text-sm font-semibold text-emerald-800">From {formatPGK(from)} / night</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {categories.length === 0 && <p className="text-sm text-stone-500">No active room types found.</p>}
      {lightbox && (
        <RoomPhotoLightbox
          images={lightbox.images}
          index={lightbox.index}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((l) => (l ? { ...l, index: i } : l))}
        />
      )}
    </>
  );
}
