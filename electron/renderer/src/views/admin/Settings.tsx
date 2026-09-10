import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LodgeSettings } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";

const DEFAULTS: LodgeSettings = {
  lodgeName: "Wellness Lodge",
  tagline: "",
  phone: "",
  reservationsPhone: "",
  whatsapp: "",
  email: "",
  reservationsEmail: "",
  address: "",
  mapUrl: "",
  checkInTime: "14:00",
  checkOutTime: "10:00",
  bankAccountName: "",
  bankName: "",
  bankBranch: "",
  bankAccountNumber: "",
  bankSwift: "",
  receiptDeadlineHours: 48,
  payAtDeskHoldHours: 12,
  depositPercent: 30,
  gstEnabled: false,
  gstPercent: 10,
  cancellationPolicy: "",
  privacyNotice: "",
  socials: {},
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<LodgeSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "public")).then((snap) => {
      if (snap.exists()) setSettings({ ...DEFAULTS, ...(snap.data() as LodgeSettings) });
      setLoading(false);
    });
  }, []);

  function set<K extends keyof LodgeSettings>(key: K, value: LodgeSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await setDoc(doc(db, "settings", "public"), settings, { merge: true });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading…</div>;

  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <p className="font-semibold text-stone-900">Contact details</p>
          <div className="mt-3 space-y-3">
            <Field label="Phone">
              <input className={inputClass} value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Reservations phone">
              <input className={inputClass} value={settings.reservationsPhone} onChange={(e) => set("reservationsPhone", e.target.value)} />
            </Field>
            <Field label="Reservations email">
              <input className={inputClass} value={settings.reservationsEmail} onChange={(e) => set("reservationsEmail", e.target.value)} />
            </Field>
            <Field label="Address">
              <input className={inputClass} value={settings.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in time">
                <input className={inputClass} value={settings.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} />
              </Field>
              <Field label="Check-out time">
                <input className={inputClass} value={settings.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-stone-900">Bank transfer details</p>
          <div className="mt-3 space-y-3">
            <Field label="Account name">
              <input className={inputClass} value={settings.bankAccountName} onChange={(e) => set("bankAccountName", e.target.value)} />
            </Field>
            <Field label="Bank name">
              <input className={inputClass} value={settings.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </Field>
            <Field label="Branch">
              <input className={inputClass} value={settings.bankBranch} onChange={(e) => set("bankBranch", e.target.value)} />
            </Field>
            <Field label="Account number">
              <input className={inputClass} value={settings.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-stone-900">Booking rules</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Receipt deadline (hours)">
              <input
                type="number"
                className={inputClass}
                value={settings.receiptDeadlineHours}
                onChange={(e) => set("receiptDeadlineHours", parseInt(e.target.value || "0", 10))}
              />
            </Field>
            <Field label="Pay-at-desk hold (hours)">
              <input
                type="number"
                className={inputClass}
                value={settings.payAtDeskHoldHours}
                onChange={(e) => set("payAtDeskHoldHours", parseInt(e.target.value || "0", 10))}
              />
            </Field>
            <Field label="Deposit (%)">
              <input
                type="number"
                className={inputClass}
                value={settings.depositPercent}
                onChange={(e) => set("depositPercent", parseInt(e.target.value || "0", 10))}
              />
            </Field>
            <Field label="GST (%)">
              <input
                type="number"
                className={inputClass}
                value={settings.gstPercent}
                onChange={(e) => set("gstPercent", parseInt(e.target.value || "0", 10))}
              />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={settings.gstEnabled} onChange={(e) => set("gstEnabled", e.target.checked)} />
            GST enabled
          </label>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-stone-900">Policies</p>
          <div className="mt-3 space-y-3">
            <Field label="Cancellation policy">
              <textarea
                className={inputClass}
                rows={4}
                value={settings.cancellationPolicy}
                onChange={(e) => set("cancellationPolicy", e.target.value)}
              />
            </Field>
            <Field label="Privacy notice">
              <textarea
                className={inputClass}
                rows={4}
                value={settings.privacyNotice}
                onChange={(e) => set("privacyNotice", e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </PrimaryButton>
        {saved && <p className="text-sm text-emerald-700">Saved.</p>}
      </div>
    </div>
  );
}
