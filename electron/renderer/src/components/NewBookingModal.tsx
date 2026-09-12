import { useState } from "react";
import { collection } from "firebase/firestore";
import { db, callCreateWalkInBooking } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { Booking, PaymentMethod, RoomCategory } from "@wellness-lodge/shared";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui";

/**
 * Front desk creates a booking for a walk-in guest or a phone call — the
 * data model already had a `source` slot for this (WALK_IN / PHONE), there
 * was just no way to actually create one before. Submits to the same
 * pricing/availability logic as the public website booking flow
 * (createWalkInBooking mirrors createBooking server-side), so the result
 * lands in AWAITING_RECEIPT or AWAITING_FRONT_DESK exactly like a guest
 * booking would — accept/confirm from there uses the existing Queue /
 * BookingDrawer actions, nothing new to learn.
 */
export default function NewBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (booking: Booking) => void;
}) {
  const { data: categories } = useCollection<RoomCategory>(() => collection(db, "roomCategories"), []);
  const activeCategories = categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);

  const [categoryId, setCategoryId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<"WALK_IN" | "PHONE">("WALK_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAY_AT_FRONT_DESK");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    categoryId && checkIn && checkOut && checkOut > checkIn && name.trim() && email.trim() && phone.trim() && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await callCreateWalkInBooking({
        categoryId,
        checkIn,
        checkOut,
        adults: parseInt(adults || "1", 10),
        children: parseInt(children || "0", 10),
        guest: { name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() },
        paymentMethod,
        source,
      });
      const data = result.data as { booking: Booking };
      onCreated(data.booking);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create this booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-stone-900">New booking</p>
          <button onClick={onClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="How is this guest booking?">
            <div className="flex gap-2">
              {(["WALK_IN", "PHONE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    source === s ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-stone-300 text-stone-600"
                  }`}
                >
                  {s === "WALK_IN" ? "Walk-in" : "Phone"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Room type">
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select a room type…</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in">
              <input type="date" className={inputClass} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </Field>
            <Field label="Check-out">
              <input type="date" className={inputClass} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Adults">
              <input type="number" min={1} className={inputClass} value={adults} onChange={(e) => setAdults(e.target.value)} />
            </Field>
            <Field label="Children">
              <input type="number" min={0} className={inputClass} value={children} onChange={(e) => setChildren(e.target.value)} />
            </Field>
          </div>

          <Field label="Guest name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <Field label="Payment method">
            <div className="flex gap-2">
              {(["PAY_AT_FRONT_DESK", "BANK_TRANSFER"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    paymentMethod === m ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-stone-300 text-stone-600"
                  }`}
                >
                  {m === "PAY_AT_FRONT_DESK" ? "Pay at front desk" : "Bank transfer"}
                </button>
              ))}
            </div>
          </Field>
          <p className="text-xs text-stone-500">
            {paymentMethod === "PAY_AT_FRONT_DESK"
              ? "Lands in the queue as a pay-at-desk request — accept it from there to start the 12-hour hold, then confirm once paid."
              : "Lands in the queue awaiting a receipt, same as a guest booking online — confirm it yourself once you've verified the transfer."}
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton onClick={submit} disabled={!canSubmit}>
              {busy ? "Creating…" : "Create booking"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
