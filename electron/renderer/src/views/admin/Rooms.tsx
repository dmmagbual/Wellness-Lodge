import { useState } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db, callSaveRatePeriod } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { RoomCategory, RatePeriod } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass, Badge } from "@/components/ui";

function RatePeriodsList({ categoryId }: { categoryId: string }) {
  const { data: rates } = useCollection<RatePeriod>(() => collection(db, "ratePeriods"), [categoryId]);
  const mine = rates.filter((r) => r.categoryId === categoryId);

  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rate, setRate] = useState("");
  const [extraAdult, setExtraAdult] = useState("0");
  const [child, setChild] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addRate() {
    setSaving(true);
    setError(null);
    try {
      await callSaveRatePeriod({
        categoryId,
        label: label || "Rate",
        startDate: start,
        endDate: end,
        nightlyRateToea: Math.round(parseFloat(rate || "0") * 100),
        extraAdultToea: Math.round(parseFloat(extraAdult || "0") * 100),
        childRateToea: Math.round(parseFloat(child || "0") * 100),
        minStayNights: 1,
        active: true,
      });
      setLabel("");
      setStart("");
      setEnd("");
      setRate("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this rate period.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rate periods</p>
      <div className="mt-2 space-y-1">
        {mine.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <span>
              {r.label} &middot; {r.startDate} → {r.endDate}
            </span>
            <span className="font-medium">{formatPGK(r.nightlyRateToea)} / night</span>
          </div>
        ))}
        {mine.length === 0 && <p className="text-sm text-stone-400">No rate periods yet.</p>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <input className={inputClass} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
        <input type="number" className={inputClass} placeholder="Nightly rate (PGK)" value={rate} onChange={(e) => setRate(e.target.value)} />
        <input type="number" className={inputClass} placeholder="Extra adult (PGK)" value={extraAdult} onChange={(e) => setExtraAdult(e.target.value)} />
        <input type="number" className={inputClass} placeholder="Child (PGK)" value={child} onChange={(e) => setChild(e.target.value)} />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-2">
        <SecondaryButton onClick={addRate} disabled={!label || !start || !end || !rate || saving}>
          {saving ? "Saving…" : "Add rate period"}
        </SecondaryButton>
      </div>
    </div>
  );
}

export default function AdminRooms() {
  const { data: categories } = useCollection<RoomCategory>(() => collection(db, "roomCategories"), []);

  async function toggleActive(cat: RoomCategory) {
    await updateDoc(doc(db, "roomCategories", cat.id), { active: !cat.active });
  }

  async function updateField(cat: RoomCategory, field: keyof RoomCategory, value: unknown) {
    await updateDoc(doc(db, "roomCategories", cat.id), { [field]: value });
  }

  const [newName, setNewName] = useState("");

  async function addCategory() {
    if (!newName) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await addDoc(collection(db, "roomCategories"), {
      name: newName,
      slug,
      description: "",
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      bedType: "",
      amenities: [],
      images: [],
      totalRooms: 1,
      active: true,
      sortOrder: categories.length + 1,
    });
    setNewName("");
  }

  return (
    <div className="p-6">
      <p className="text-sm text-stone-500">
        Rate changes require Manager or Administrator and never rewrite the price already locked into a confirmed
        booking — only new searches and bookings use the updated rate.
      </p>

      <div className="mt-5 space-y-4">
        {categories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((cat) => (
            <Card key={cat.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-stone-900">{cat.name}</p>
                  <Badge tone={cat.active ? "emerald" : "stone"}>{cat.active ? "Active" : "Inactive"}</Badge>
                </div>
                <SecondaryButton onClick={() => toggleActive(cat)}>{cat.active ? "Deactivate" : "Activate"}</SecondaryButton>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Total rooms">
                  <input
                    type="number"
                    className={inputClass}
                    defaultValue={cat.totalRooms}
                    onBlur={(e) => updateField(cat, "totalRooms", parseInt(e.target.value || "0", 10))}
                  />
                </Field>
                <Field label="Max adults">
                  <input
                    type="number"
                    className={inputClass}
                    defaultValue={cat.maxAdults}
                    onBlur={(e) => updateField(cat, "maxAdults", parseInt(e.target.value || "0", 10))}
                  />
                </Field>
                <Field label="Max occupancy">
                  <input
                    type="number"
                    className={inputClass}
                    defaultValue={cat.maxOccupancy}
                    onBlur={(e) => updateField(cat, "maxOccupancy", parseInt(e.target.value || "0", 10))}
                  />
                </Field>
              </div>
              <RatePeriodsList categoryId={cat.id} />
            </Card>
          ))}
      </div>

      <Card className="mt-6 p-4">
        <p className="font-semibold text-stone-900">Add a room category</p>
        <div className="mt-2 flex gap-2">
          <input className={inputClass} placeholder="e.g. Ocean View Room" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <PrimaryButton onClick={addCategory} disabled={!newName}>
            Add
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
