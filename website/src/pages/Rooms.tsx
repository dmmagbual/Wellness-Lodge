import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRoomCategories, fetchRatePeriods, fetchSettings } from "@/lib/data";
import type { RoomCategory, RatePeriod, LodgeSettings, PriceSnapshot } from "@wellness-lodge/shared";
import { formatPGK, todayStr, computePriceSnapshot } from "@wellness-lodge/shared";
import { Card, Pill, SectionHeading, SampleTag, Field, PrimaryButton, inputClass } from "@/components/ui";
import PhotoImg from "@/components/PhotoImg";
import Gallery from "@/components/Gallery";
import { ROOM_IMAGES, ROOM_IMAGE_FALLBACK } from "@/lib/media";

function offsetDateStr(days: number): string {
  const d = new Date(todayStr() + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface SearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<RoomCategory[]>([]);
  const [rates, setRates] = useState<Record<string, RatePeriod[]>>({});
  const [settings, setSettings] = useState<Partial<LodgeSettings> | null>(null);
  const [loading, setLoading] = useState(true);

  const defaults: SearchParams = { checkIn: offsetDateStr(1), checkOut: offsetDateStr(2), adults: 2, children: 0 };
  const [draft, setDraft] = useState<SearchParams>(defaults);
  const [search, setSearch] = useState<SearchParams>(defaults);

  useEffect(() => {
    (async () => {
      const [cats, s] = await Promise.all([fetchRoomCategories(), fetchSettings()]);
      setRooms(cats);
      setSettings(s);
      const entries = await Promise.all(cats.map(async (c) => [c.id, await fetchRatePeriods(c.id)] as const));
      setRates(Object.fromEntries(entries));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const nights = useMemo(() => {
    if (!search.checkIn || !search.checkOut || search.checkOut <= search.checkIn) return 0;
    return Math.round((+new Date(search.checkOut) - +new Date(search.checkIn)) / 86400000);
  }, [search]);

  const results = useMemo(() => {
    return rooms.map((room) => {
      const fitsParty = search.adults + search.children <= room.maxOccupancy;
      let quote: PriceSnapshot | null = null;
      let error: "NO_RATE" | null = null;
      if (fitsParty && nights > 0) {
        try {
          quote = computePriceSnapshot({
            categoryId: room.id,
            categoryName: room.name,
            checkIn: search.checkIn,
            checkOut: search.checkOut,
            adults: search.adults,
            children: search.children,
            baseOccupancy: room.maxAdults,
            ratePeriods: rates[room.id] ?? [],
            gstEnabled: settings?.gstEnabled ?? false,
            gstPercent: settings?.gstPercent ?? 10,
            depositPercent: settings?.depositPercent ?? 30,
          });
        } catch {
          error = "NO_RATE";
        }
      }
      return { room, fitsParty, quote, error };
    });
  }, [rooms, rates, settings, search, nights]);

  const bookHref = (categoryId: string) =>
    `/book?category=${categoryId}&checkIn=${search.checkIn}&checkOut=${search.checkOut}&adults=${search.adults}&children=${search.children}`;

  const validDraft = draft.checkIn && draft.checkOut && draft.checkOut > draft.checkIn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        eyebrow="Accommodation"
        title="Rooms & Rates"
        subtitle="All rates shown in PGK (Kina). Sample photos shown below — final photography pending lodge-approved content."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      {/* Search bar */}
      <Card className="mx-auto mt-8 max-w-4xl p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Check-in">
            <input
              type="date"
              min={todayStr()}
              className={inputClass}
              value={draft.checkIn}
              onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))}
            />
          </Field>
          <Field label="Check-out">
            <input
              type="date"
              min={draft.checkIn || todayStr()}
              className={inputClass}
              value={draft.checkOut}
              onChange={(e) => setDraft((d) => ({ ...d, checkOut: e.target.value }))}
            />
          </Field>
          <Field label="Adults">
            <input
              type="number"
              min={1}
              max={20}
              className={inputClass}
              value={draft.adults}
              onChange={(e) => setDraft((d) => ({ ...d, adults: parseInt(e.target.value || "1", 10) }))}
            />
          </Field>
          <Field label="Children">
            <input
              type="number"
              min={0}
              max={20}
              className={inputClass}
              value={draft.children}
              onChange={(e) => setDraft((d) => ({ ...d, children: parseInt(e.target.value || "0", 10) }))}
            />
          </Field>
          <PrimaryButton
            className="w-full sm:w-auto"
            disabled={!validDraft}
            onClick={() => setSearch(draft)}
          >
            Check rates
          </PrimaryButton>
        </div>
        {!validDraft && (
          <p className="mt-2 text-xs text-red-600">Check-out must be a date after check-in.</p>
        )}
      </Card>

      {loading && (
        <div className="mt-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      )}

      {/* Results */}
      <div className="mt-10 space-y-5">
        {results.map(({ room, fitsParty, quote, error }) => {
          const photos = ROOM_IMAGES[room.slug] ?? [ROOM_IMAGE_FALLBACK];
          return (
          <Card key={room.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-56 sm:h-auto sm:w-64 sm:shrink-0">
                <PhotoImg src={photos[0]} alt={room.name} className="h-full" />
                {photos.length > 1 && (
                  <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    +{photos.length - 1} more
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-xl font-semibold text-stone-900">{room.name}</h3>
                  <p className="mt-1 text-sm text-stone-600">{room.description}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    Sleeps up to {room.maxOccupancy} &middot; {room.bedType}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 5).map((a) => (
                      <Pill key={a}>{a}</Pill>
                    ))}
                  </div>
                  {photos.length > 1 && (
                    <details className="mt-3 group/gallery">
                      <summary className="cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                        View photos
                      </summary>
                      <div className="mt-3">
                        <Gallery images={photos} altPrefix={room.name} className="sm:grid-cols-4" />
                      </div>
                    </details>
                  )}
                  {!fitsParty && (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      This room sleeps up to {room.maxOccupancy} guests — reduce your party size to see rates.
                    </p>
                  )}
                  {fitsParty && error === "NO_RATE" && (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      No published rate for these dates yet — contact the front desk for a quote.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 border-t border-stone-100 pt-4 sm:w-56 sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  {fitsParty && quote ? (
                    <>
                      <div className="text-left sm:text-right">
                        <span className="text-2xl font-bold text-stone-900">
                          {formatPGK(quote.nights[0]?.rateToea ?? 0)}
                        </span>
                        <span className="ml-1 text-sm text-stone-500">/ night</span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Rate for {nights} night{nights > 1 ? "s" : ""} &middot; {quote.gstEnabled ? "Tax inclusive" : "Tax exclusive"}
                      </p>
                      <p className="text-sm font-semibold text-stone-900">Total {formatPGK(quote.totalToea)}</p>
                      <Link
                        to={bookHref(room.id)}
                        className="mt-1 w-full rounded-full bg-emerald-700 px-5 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-800 sm:w-auto"
                      >
                        Book
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/contact"
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Enquire
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      {!loading && rooms.length === 0 && (
        <p className="mt-10 text-center text-stone-500">
          No rooms are published yet. Seed the demo data (see the README) or add rooms in the admin app.
        </p>
      )}
    </div>
  );
}
