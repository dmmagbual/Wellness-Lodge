import { useState } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { CarRentalVehicle } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass, Badge } from "@/components/ui";

/** Vehicles live in the `carRentalVehicles` collection — the exact same
 * collection the public website reads from (fetchCarRentalFleet() in
 * website/src/lib/data.ts), so this screen is the source of truth for the
 * Car Rental page's fleet and pricing. */
export default function SettingsCarRental() {
  const { data: fleet } = useCollection<CarRentalVehicle>(() => collection(db, "carRentalVehicles"), []);

  async function toggleActive(v: CarRentalVehicle) {
    await updateDoc(doc(db, "carRentalVehicles", v.id), { active: !v.active });
  }

  async function updateField(v: CarRentalVehicle, field: keyof CarRentalVehicle, value: unknown) {
    await updateDoc(doc(db, "carRentalVehicles", v.id), { [field]: value });
  }

  function updateList(v: CarRentalVehicle, field: "inclusions" | "requirements", raw: string) {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(v, field, list);
  }

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  async function addVehicle() {
    if (!newName) return;
    await addDoc(collection(db, "carRentalVehicles"), {
      name: newName,
      category: newCategory || "Sedan",
      dailyRateToea: 0,
      seats: 5,
      transmission: "AUTOMATIC",
      images: [],
      inclusions: [],
      requirements: [],
      active: true,
    });
    setNewName("");
    setNewCategory("");
  }

  return (
    <div>
      <p className="text-sm text-stone-500">
        This is the exact fleet and pricing shown on the public Car Rental page — changes here appear live on the
        website. Deactivated vehicles are hidden from guests but kept on file.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {fleet.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-stone-900">{v.name}</p>
                <Badge tone={v.active ? "emerald" : "stone"}>{v.active ? "Active" : "Inactive"}</Badge>
                <span className="text-xs text-stone-400">{formatPGK(v.dailyRateToea)} / day</span>
              </div>
              <SecondaryButton onClick={() => toggleActive(v)}>
                {v.active ? "Deactivate" : "Activate"}
              </SecondaryButton>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input className={inputClass} defaultValue={v.name} onBlur={(e) => updateField(v, "name", e.target.value)} />
              </Field>
              <Field label="Category">
                <input className={inputClass} defaultValue={v.category} onBlur={(e) => updateField(v, "category", e.target.value)} />
              </Field>
              <Field label="Daily rate (PGK)">
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  defaultValue={(v.dailyRateToea / 100).toFixed(2)}
                  onBlur={(e) => updateField(v, "dailyRateToea", Math.round(parseFloat(e.target.value || "0") * 100))}
                />
              </Field>
              <Field label="Seats">
                <input
                  type="number"
                  className={inputClass}
                  defaultValue={v.seats}
                  onBlur={(e) => updateField(v, "seats", parseInt(e.target.value || "0", 10))}
                />
              </Field>
              <Field label="Transmission">
                <select
                  className={inputClass}
                  defaultValue={v.transmission}
                  onChange={(e) => updateField(v, "transmission", e.target.value)}
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </Field>
              <Field label="Inclusions" hint="Comma separated">
                <input
                  className={inputClass}
                  defaultValue={v.inclusions.join(", ")}
                  onBlur={(e) => updateList(v, "inclusions", e.target.value)}
                />
              </Field>
              <Field label="Requirements" hint="Comma separated">
                <input
                  className={`${inputClass} sm:col-span-2`}
                  defaultValue={v.requirements.join(", ")}
                  onBlur={(e) => updateList(v, "requirements", e.target.value)}
                />
              </Field>
            </div>
          </Card>
        ))}
        {fleet.length === 0 && <p className="text-sm text-stone-400">No vehicles yet.</p>}
      </div>

      <Card className="mt-6 p-4">
        <p className="font-semibold text-stone-900">Add a vehicle</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input className={inputClass} placeholder="Vehicle name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input
            className={inputClass}
            placeholder="Category, e.g. Sedan"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <PrimaryButton onClick={addVehicle} disabled={!newName}>
            Add vehicle
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
