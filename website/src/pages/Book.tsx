import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchRoomCategories, fetchRatePeriods, fetchSettings } from "@/lib/data";
import { callCheckAvailability, callCreateBooking } from "@/lib/firebase";
import {
  computePriceSnapshot,
  formatPGK,
  todayStr,
  type RoomCategory,
  type RatePeriod,
  type LodgeSettings,
  type PaymentMethod,
  type Booking,
} from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SecondaryButton, SectionHeading, inputClass } from "@/components/ui";
import BookingStatusPanel from "@/components/BookingStatusPanel";

type Step = 1 | 2 | 3 | 4;

export default function Book() {
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>(1);

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [rates, setRates] = useState<Record<string, RatePeriod[]>>({});
  const [settings, setSettings] = useState<Partial<LodgeSettings> | null>(null);

  const [categoryId, setCategoryId] = useState(params.get("category") ?? "");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? "");
  const [adults, setAdults] = useState(() => {
    const n = parseInt(params.get("adults") ?? "2", 10);
    return Number.isFinite(n) && n > 0 ? n : 2;
  });
  const [children, setChildren] = useState(() => {
    const n = parseInt(params.get("children") ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  });

  const [availability, setAvailability] = useState<{ available: boolean; remaining: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [autoChecked, setAutoChecked] = useState(false);
  const cameFromSearch = Boolean(params.get("category") && params.get("checkIn") && params.get("checkOut"));

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    (async () => {
      const [cats, s] = await Promise.all([fetchRoomCategories(), fetchSettings()]);
      setCategories(cats);
      setSettings(s);
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
      const entries = await Promise.all(cats.map(async (c) => [c.id, await fetchRatePeriods(c.id)] as const));
      setRates(Object.fromEntries(entries));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = categories.find((c) => c.id === categoryId) ?? null;

  const quote = useMemo(() => {
    if (!category || !checkIn || !checkOut || checkOut <= checkIn) return null;
    const periods = rates[category.id] ?? [];
    if (periods.length === 0) return null;
    try {
      return computePriceSnapshot({
        categoryId: category.id,
        categoryName: category.name,
        checkIn,
        checkOut,
        adults,
        children,
        baseOccupancy: category.maxAdults,
        ratePeriods: periods,
        gstEnabled: settings?.gstEnabled ?? false,
        gstPercent: settings?.gstPercent ?? 10,
        depositPercent: settings?.depositPercent ?? 30,
      });
    } catch {
      return null;
    }
  }, [category, checkIn, checkOut, adults, children, rates, settings]);

  async function handleCheckAvailability() {
    if (!category || !checkIn || !checkOut) return;
    setChecking(true);
    setAvailabilityError(null);
    setAvailability(null);
    try {
      const res = await callCheckAvailability({ categoryId: category.id, checkIn, checkOut });
      const data = res.data as { available: boolean; remaining: number };
      setAvailability(data);
      if (data.available) setStep(2);
    } catch (e) {
      setAvailabilityError(e instanceof Error ? e.message : "Could not check availability. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  // Coming from the Rooms & Rates search: dates/room/occupancy are already
  // chosen, so skip straight to an availability check instead of making the
  // guest re-enter what they just searched for.
  useEffect(() => {
    if (!cameFromSearch || autoChecked || checking) return;
    if (!category || !checkIn || !checkOut || checkOut <= checkIn) return;
    setAutoChecked(true);
    handleCheckAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameFromSearch, autoChecked, checking, category, checkIn, checkOut]);

  async function handleSubmitBooking() {
    if (!category) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await callCreateBooking({
        categoryId: category.id,
        checkIn,
        checkOut,
        adults,
        children,
        guest: { name: guestName, email: guestEmail, phone: guestPhone, notes: guestNotes },
        paymentMethod,
      });
      const data = res.data as { booking: Booking };
      setConfirmedBooking(data.booking);
      setStep(4);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not create the booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 4 && confirmedBooking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <SectionHeading eyebrow="Booking received" title="Thank you — here's your booking" />
        <div className="mt-8">
          <BookingStatusPanel booking={confirmedBooking} settings={settings} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHeading eyebrow="Reserve" title="Book Your Stay" />

      {cameFromSearch && (
        <p className="mt-3 text-center text-sm text-stone-500">
          <Link to="/rooms" className="font-medium text-emerald-700 hover:text-emerald-800">
            &larr; Edit search
          </Link>
        </p>
      )}

      <ol className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-stone-500">
        {["Dates & room", "Confirm quote", "Your details"].map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${i + 1 === step ? "text-emerald-700" : ""}`}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                i + 1 <= step ? "bg-emerald-700 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {i + 1}
            </span>
            {label}
            {i < 2 && <span className="mx-1 text-stone-300">&rarr;</span>}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <Card className="mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room type">
              <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div />
            <Field label="Check-in">
              <input
                type="date"
                min={todayStr()}
                className={inputClass}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </Field>
            <Field label="Check-out">
              <input
                type="date"
                min={checkIn || todayStr()}
                className={inputClass}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </Field>
            <Field label="Adults">
              <input
                type="number"
                min={1}
                max={20}
                className={inputClass}
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value || "1", 10))}
              />
            </Field>
            <Field label="Children">
              <input
                type="number"
                min={0}
                max={20}
                className={inputClass}
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value || "0", 10))}
              />
            </Field>
          </div>

          {availabilityError && <p className="mt-4 text-sm text-red-600">{availabilityError}</p>}
          {availability && !availability.available && (
            <p className="mt-4 text-sm text-red-600">
              No rooms of this type are available for those dates. Try different dates or a different room type.
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <PrimaryButton
              onClick={handleCheckAvailability}
              disabled={!categoryId || !checkIn || !checkOut || checkOut <= checkIn || checking}
            >
              {checking ? "Checking…" : "Check availability"}
            </PrimaryButton>
          </div>
        </Card>
      )}

      {step === 2 && quote && category && (
        <Card className="mt-8 p-6">
          <h3 className="font-semibold text-stone-900">Your quote</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">
                {category.name} &middot; {quote.nights.length} night{quote.nights.length > 1 ? "s" : ""}
              </dt>
              <dd className="font-medium text-stone-900">
                {formatPGK(quote.subtotalToea - quote.extraAdultChargeToea - quote.childChargeToea - quote.addOnsToea)}
              </dd>
            </div>
            {quote.extraAdultChargeToea > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-600">Extra adult charge</dt>
                <dd className="font-medium text-stone-900">{formatPGK(quote.extraAdultChargeToea)}</dd>
              </div>
            )}
            {quote.childChargeToea > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-600">Child charge</dt>
                <dd className="font-medium text-stone-900">{formatPGK(quote.childChargeToea)}</dd>
              </div>
            )}
            {quote.gstEnabled && (
              <div className="flex justify-between">
                <dt className="text-stone-600">GST</dt>
                <dd className="font-medium text-stone-900">{formatPGK(quote.gstToea)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base">
              <dt className="font-semibold text-stone-900">Total</dt>
              <dd className="font-bold text-stone-900">{formatPGK(quote.totalToea)}</dd>
            </div>
            <div className="flex justify-between text-stone-500">
              <dt>Deposit ({quote.depositPercent}%)</dt>
              <dd>{formatPGK(quote.depositToea)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-stone-500">
            This is an estimate. The confirmed price is recalculated and locked to your booking when you submit
            it, and will not change even if rates are updated later.
          </p>
          <div className="mt-6 flex justify-between">
            <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
            <PrimaryButton onClick={() => setStep(3)}>Continue</PrimaryButton>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="mt-8 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input className={inputClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
            </Field>
            <div />
            <div className="sm:col-span-2">
              <Field label="Special requests (optional)">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-stone-700">How would you like to pay?</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-lg border p-4 text-sm ${
                  paymentMethod === "BANK_TRANSFER" ? "border-emerald-600 ring-1 ring-emerald-600" : "border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mr-2"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                />
                Bank transfer
                <p className="mt-1 text-xs text-stone-500">
                  We'll send bank details and a reference. Upload your receipt once transferred.
                </p>
              </label>
              <label
                className={`cursor-pointer rounded-lg border p-4 text-sm ${
                  paymentMethod === "PAY_AT_FRONT_DESK"
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mr-2"
                  checked={paymentMethod === "PAY_AT_FRONT_DESK"}
                  onChange={() => setPaymentMethod("PAY_AT_FRONT_DESK")}
                />
                Pay at front desk
                <p className="mt-1 text-xs text-stone-500">
                  Once the desk accepts your request, your room is held for {settings?.payAtDeskHoldHours ?? 12}{" "}
                  hours.
                </p>
              </label>
            </div>
          </fieldset>

          {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

          <div className="mt-6 flex justify-between">
            <SecondaryButton onClick={() => setStep(2)}>Back</SecondaryButton>
            <PrimaryButton
              onClick={handleSubmitBooking}
              disabled={!guestName || !guestEmail || !guestPhone || submitting}
            >
              {submitting ? "Submitting…" : "Submit booking request"}
            </PrimaryButton>
          </div>
        </Card>
      )}
    </div>
  );
}
