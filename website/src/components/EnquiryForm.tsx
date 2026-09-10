import { useState } from "react";
import { callSubmitEnquiry } from "@/lib/firebase";
import type { EnquiryType } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";

export default function EnquiryForm({ type, title }: { type: EnquiryType; title: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await callSubmitEnquiry({
        type,
        name,
        email,
        phone,
        preferredDate: preferredDate || undefined,
        message,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-6">
        <p className="font-semibold text-emerald-700">Thanks, {name.split(" ")[0] || "there"} — enquiry received.</p>
        <p className="mt-1 text-sm text-stone-600">The lodge desk will get back to you shortly.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Preferred date (optional)">
          <input type="date" className={inputClass} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tell us what you need">
            <textarea className={inputClass} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex justify-end">
        <PrimaryButton onClick={handleSubmit} disabled={!name || !email || !phone || !message || submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </PrimaryButton>
      </div>
    </Card>
  );
}
