import { useState } from "react";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { storage, callSubmitReceipt } from "@/lib/firebase";
import { formatPGK } from "@wellness-lodge/shared";
import type { Booking, LodgeSettings } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, inputClass, Pill } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  AWAITING_RECEIPT: "Awaiting your bank transfer receipt",
  AWAITING_FRONT_DESK: "With the front desk for review",
  HELD: "Held — pay at the front desk before the deadline below",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  REJECTED: "Receipt rejected — please upload a clearer copy",
};

export default function BookingStatusPanel({
  booking,
  settings,
  onRefresh,
}: {
  booking: Booking;
  settings: Partial<LodgeSettings> | null;
  onRefresh?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(String((booking.price.depositToea / 100).toFixed(2)));
  const balanceToea = booking.price.totalToea - booking.price.depositToea;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const canUploadReceipt =
    booking.paymentMethod === "BANK_TRANSFER" &&
    ["AWAITING_RECEIPT", "AWAITING_FRONT_DESK"].includes(booking.status) &&
    booking.paymentStatus !== "VERIFIED";

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = `receipts/${booking.bookingRef}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      await callSubmitReceipt({
        bookingRef: booking.bookingRef,
        email: booking.guest.email,
        storagePath: path,
        amountStatedToea: Math.round(parseFloat(amount || "0") * 100),
      });
      setUploaded(true);
      onRefresh?.();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">Booking reference</p>
            <p className="text-2xl font-bold tracking-tight text-stone-900">{booking.bookingRef}</p>
          </div>
          <Pill>{STATUS_LABEL[booking.status] ?? booking.status}</Pill>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-stone-500">Check-in</dt>
            <dd className="font-medium text-stone-900">{booking.checkIn}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Check-out</dt>
            <dd className="font-medium text-stone-900">{booking.checkOut}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Room</dt>
            <dd className="font-medium text-stone-900">{booking.price.categoryName}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Total</dt>
            <dd className="font-medium text-stone-900">{formatPGK(booking.price.totalToea)}</dd>
          </div>
        </dl>
        {booking.status === "HELD" && booking.holdExpiresAt && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Please pay at the front desk before{" "}
            <strong>{new Date(booking.holdExpiresAt).toLocaleString()}</strong> or this hold is released
            automatically.
          </p>
        )}
        {booking.status === "AWAITING_RECEIPT" && booking.receiptDeadlineAt && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Please transfer and upload your receipt before{" "}
            <strong>{new Date(booking.receiptDeadlineAt).toLocaleString()}</strong>.
          </p>
        )}
      </Card>

      {booking.paymentMethod === "BANK_TRANSFER" && (
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">How to pay by bank transfer</h3>

          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-200">
            <div className="flex justify-between">
              <span className="text-emerald-900">1. Transfer the deposit now</span>
              <span className="font-semibold text-emerald-900">{formatPGK(booking.price.depositToea)}</span>
            </div>
            <div className="mt-1 flex justify-between text-emerald-800">
              <span>2. Pay the balance at check-in</span>
              <span className="font-medium">{formatPGK(balanceToea)}</span>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-stone-700">Transfer to:</p>
          <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Account name</dt>
              <dd className="font-medium text-stone-900">{settings?.bankAccountName ?? "To be confirmed"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Bank</dt>
              <dd className="font-medium text-stone-900">{settings?.bankName ?? "To be confirmed"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Account number</dt>
              <dd className="font-medium text-stone-900">{settings?.bankAccountNumber ?? "To be confirmed"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Branch</dt>
              <dd className="font-medium text-stone-900">{settings?.bankBranch ?? "To be confirmed"}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Use <strong>{booking.bookingRef}</strong> as your transfer reference — without it the front desk
            can't match your payment to this booking.
          </p>

          {canUploadReceipt && !uploaded && (
            <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
              <p className="text-sm font-medium text-stone-700">3. Upload your receipt so we can confirm it</p>
              <Field label="Amount transferred (PGK)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Upload your transfer receipt" hint="JPEG, PNG or PDF, up to 8 MB.">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </Field>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <PrimaryButton onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? "Uploading…" : "Submit receipt"}
              </PrimaryButton>
            </div>
          )}
          {uploaded && (
            <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
              Receipt received — the front desk will verify it against the bank account and confirm your stay.
            </p>
          )}
        </Card>
      )}

      {booking.paymentMethod === "PAY_AT_FRONT_DESK" && (
        <Card className="p-6">
          <h3 className="font-semibold text-stone-900">Pay at front desk</h3>
          <p className="mt-2 text-sm text-stone-600">
            Your request has been sent to the front desk. Once accepted, your room is held for{" "}
            {settings?.payAtDeskHoldHours ?? 12} hours — pay on arrival to confirm your stay.
          </p>
        </Card>
      )}
    </div>
  );
}
