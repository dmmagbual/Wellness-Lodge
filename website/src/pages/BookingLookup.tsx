import { useState } from "react";
import { callLookupBooking } from "@/lib/firebase";
import { fetchSettings } from "@/lib/data";
import type { Booking, LodgeSettings } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SectionHeading, inputClass } from "@/components/ui";
import BookingStatusPanel from "@/components/BookingStatusPanel";

export default function BookingLookup() {
  const [bookingRef, setBookingRef] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Partial<LodgeSettings> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const [res, s] = await Promise.all([
        callLookupBooking({ bookingRef, email }),
        fetchSettings(),
      ]);
      setBooking((res.data as { booking: Booking }).booking);
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No booking found with that reference and email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHeading eyebrow="Guests" title="Find My Booking" />
      <Card className="mt-8 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Booking reference">
            <input
              className={inputClass}
              placeholder="WL-XXXXXX"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
            />
          </Field>
          <Field label="Email used to book">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end">
          <PrimaryButton onClick={handleLookup} disabled={!bookingRef || !email || loading}>
            {loading ? "Looking up…" : "Find my booking"}
          </PrimaryButton>
        </div>
      </Card>

      {booking && (
        <div className="mt-8">
          <BookingStatusPanel booking={booking} settings={settings} onRefresh={handleLookup} />
        </div>
      )}
    </div>
  );
}
