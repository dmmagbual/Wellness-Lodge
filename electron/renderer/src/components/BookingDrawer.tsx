import { useEffect, useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  callAcceptPayAtDesk,
  callConfirmBooking,
  callRejectReceipt,
  callCancelBooking,
  callCheckInGuest,
  callCheckOutGuest,
} from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { Booking, PaymentReceipt, StaffRole } from "@wellness-lodge/shared";
import { Badge, Card, DangerButton, PrimaryButton, SecondaryButton, Field, inputClass } from "@/components/ui";

const STATUS_TONE: Record<string, "amber" | "emerald" | "stone" | "red" | "blue"> = {
  AWAITING_RECEIPT: "amber",
  AWAITING_FRONT_DESK: "amber",
  HELD: "blue",
  CONFIRMED: "emerald",
  CHECKED_IN: "emerald",
  COMPLETED: "stone",
  EXPIRED: "red",
  CANCELLED: "red",
  REJECTED: "red",
};

function ReceiptImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    getDownloadURL(storageRef(storage, path))
      .then(setUrl)
      .catch(() => setError(true));
  }, [path]);
  if (error) return <p className="text-xs text-red-600">Could not load receipt file.</p>;
  if (!url) return <p className="text-xs text-stone-500">Loading receipt…</p>;
  if (path.toLowerCase().endsWith(".pdf")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">
        Open receipt PDF
      </a>
    );
  }
  return <img src={url} alt="Payment receipt" className="max-h-64 rounded-lg border border-stone-200" />;
}

export default function BookingDrawer({
  booking,
  role,
  onClose,
  onActionDone,
}: {
  booking: Booking;
  role: StaffRole;
  onClose: () => void;
  onActionDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonFor, setShowReasonFor] = useState<"reject" | "cancel" | null>(null);

  const { data: receipts } = useCollection<PaymentReceipt>(
    () => query(collection(db, "paymentReceipts"), where("bookingRef", "==", booking.bookingRef), orderBy("uploadedAt", "desc")),
    [booking.bookingRef]
  );

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onActionDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const canManage = ["FRONT_DESK", "MANAGER", "ADMINISTRATOR"].includes(role);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-lg font-bold text-stone-900">{booking.bookingRef}</p>
            <Badge tone={STATUS_TONE[booking.status] ?? "stone"}>{booking.status.replaceAll("_", " ")}</Badge>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          <Card className="p-4">
            <p className="font-semibold text-stone-900">{booking.guest.name}</p>
            <p className="text-sm text-stone-600">{booking.guest.email}</p>
            <p className="text-sm text-stone-600">{booking.guest.phone}</p>
            {booking.guest.notes && <p className="mt-2 text-sm italic text-stone-500">"{booking.guest.notes}"</p>}
          </Card>

          <Card className="p-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-stone-500">Room type</dt>
                <dd className="font-medium text-stone-900">{booking.price.categoryName}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Nights</dt>
                <dd className="font-medium text-stone-900">{booking.nights}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Check-in</dt>
                <dd className="font-medium text-stone-900">{booking.checkIn}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Check-out</dt>
                <dd className="font-medium text-stone-900">{booking.checkOut}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Adults / Children</dt>
                <dd className="font-medium text-stone-900">
                  {booking.price.adults} / {booking.price.children}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Total</dt>
                <dd className="font-medium text-stone-900">{formatPGK(booking.price.totalToea)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Payment method</dt>
                <dd className="font-medium text-stone-900">{booking.paymentMethod.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Payment status</dt>
                <dd className="font-medium text-stone-900">{booking.paymentStatus.replaceAll("_", " ")}</dd>
              </div>
            </dl>
            {booking.holdExpiresAt && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                Hold expires {new Date(booking.holdExpiresAt).toLocaleString()}
              </p>
            )}
            {booking.receiptDeadlineAt && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                Receipt due {new Date(booking.receiptDeadlineAt).toLocaleString()}
              </p>
            )}
          </Card>

          {receipts.length > 0 && (
            <Card className="p-4">
              <p className="font-semibold text-stone-900">Payment receipts</p>
              <div className="mt-3 space-y-4">
                {receipts.map((r) => (
                  <div key={r.id} className="border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>{new Date(r.uploadedAt).toLocaleString()}</span>
                      <Badge tone={r.status === "VERIFIED" ? "emerald" : r.status === "REJECTED" ? "red" : "amber"}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-stone-700">Guest stated amount: {formatPGK(r.amountStated)}</p>
                    <div className="mt-2">
                      <ReceiptImage path={r.storagePath} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {canManage && (
            <div className="space-y-2">
              {booking.status === "AWAITING_FRONT_DESK" && booking.paymentMethod === "PAY_AT_FRONT_DESK" && (
                <PrimaryButton className="w-full" disabled={busy} onClick={() => run(() => callAcceptPayAtDesk({ bookingRef: booking.bookingRef }))}>
                  Accept — start 12h hold
                </PrimaryButton>
              )}
              {(booking.status === "HELD" ||
                (booking.status === "AWAITING_FRONT_DESK" && booking.paymentMethod === "BANK_TRANSFER")) && (
                <PrimaryButton className="w-full" disabled={busy} onClick={() => run(() => callConfirmBooking({ bookingRef: booking.bookingRef }))}>
                  Confirm payment received
                </PrimaryButton>
              )}
              {booking.status === "AWAITING_FRONT_DESK" && booking.paymentMethod === "BANK_TRANSFER" && (
                <SecondaryButton
                  className="w-full"
                  disabled={busy}
                  onClick={() => setShowReasonFor(showReasonFor === "reject" ? null : "reject")}
                >
                  Reject receipt — ask for a clearer copy
                </SecondaryButton>
              )}
              {booking.status === "CONFIRMED" && (
                <PrimaryButton className="w-full" disabled={busy} onClick={() => run(() => callCheckInGuest({ bookingRef: booking.bookingRef }))}>
                  Check in
                </PrimaryButton>
              )}
              {booking.status === "CHECKED_IN" && (
                <PrimaryButton className="w-full" disabled={busy} onClick={() => run(() => callCheckOutGuest({ bookingRef: booking.bookingRef }))}>
                  Check out
                </PrimaryButton>
              )}
              {!["CANCELLED", "COMPLETED", "EXPIRED", "REJECTED"].includes(booking.status) && (
                <DangerButton className="w-full" disabled={busy} onClick={() => setShowReasonFor(showReasonFor === "cancel" ? null : "cancel")}>
                  Cancel booking
                </DangerButton>
              )}

              {showReasonFor && (
                <div className="rounded-lg border border-stone-200 p-3">
                  <Field label={showReasonFor === "reject" ? "Reason for rejecting the receipt" : "Reason for cancelling"}>
                    <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                  <div className="mt-2 flex justify-end gap-2">
                    <SecondaryButton onClick={() => setShowReasonFor(null)}>Close</SecondaryButton>
                    <PrimaryButton
                      disabled={!reason || busy}
                      onClick={() =>
                        run(() =>
                          showReasonFor === "reject"
                            ? callRejectReceipt({ bookingRef: booking.bookingRef, reason })
                            : callCancelBooking({ bookingRef: booking.bookingRef, reason })
                        )
                      }
                    >
                      Confirm
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
