import { useState } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { FunctionHallPackage } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass, Badge } from "@/components/ui";

/** Packages live in the `functionHallPackages` collection — the exact same
 * collection the public website reads from (fetchFunctionHallPackages() in
 * website/src/lib/data.ts), so this screen is the source of truth for the
 * Function Hall & Events page's packages and pricing. */
export default function SettingsFunctionHall() {
  const { data: packages } = useCollection<FunctionHallPackage>(() => collection(db, "functionHallPackages"), []);

  async function toggleActive(p: FunctionHallPackage) {
    await updateDoc(doc(db, "functionHallPackages", p.id), { active: !p.active });
  }

  async function updateField(p: FunctionHallPackage, field: keyof FunctionHallPackage, value: unknown) {
    await updateDoc(doc(db, "functionHallPackages", p.id), { [field]: value });
  }

  function updateInclusions(p: FunctionHallPackage, raw: string) {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(p, "inclusions", list);
  }

  const [newName, setNewName] = useState("");

  async function addPackage() {
    if (!newName) return;
    await addDoc(collection(db, "functionHallPackages"), {
      name: newName,
      capacitySeated: 50,
      capacityStanding: 80,
      priceFromToea: 0,
      inclusions: [],
      images: [],
      active: true,
    });
    setNewName("");
  }

  return (
    <div>
      <p className="text-sm text-stone-500">
        This is the exact package list and pricing shown on the public Function Hall &amp; Events page — changes
        here appear live on the website. Deactivated packages are hidden from guests but kept on file.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {packages.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-stone-900">{p.name}</p>
                <Badge tone={p.active ? "emerald" : "stone"}>{p.active ? "Active" : "Inactive"}</Badge>
              </div>
              <SecondaryButton onClick={() => toggleActive(p)}>
                {p.active ? "Deactivate" : "Activate"}
              </SecondaryButton>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Package name">
                <input className={inputClass} defaultValue={p.name} onBlur={(e) => updateField(p, "name", e.target.value)} />
              </Field>
              <Field label="Price from (PGK)">
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  defaultValue={(p.priceFromToea / 100).toFixed(2)}
                  onBlur={(e) => updateField(p, "priceFromToea", Math.round(parseFloat(e.target.value || "0") * 100))}
                />
              </Field>
              <Field label="Seated capacity">
                <input
                  type="number"
                  className={inputClass}
                  defaultValue={p.capacitySeated}
                  onBlur={(e) => updateField(p, "capacitySeated", parseInt(e.target.value || "0", 10))}
                />
              </Field>
              <Field label="Standing capacity">
                <input
                  type="number"
                  className={inputClass}
                  defaultValue={p.capacityStanding}
                  onBlur={(e) => updateField(p, "capacityStanding", parseInt(e.target.value || "0", 10))}
                />
              </Field>
              <Field label="Inclusions" hint="Comma separated">
                <input
                  className={`${inputClass} sm:col-span-2`}
                  defaultValue={p.inclusions.join(", ")}
                  onBlur={(e) => updateInclusions(p, e.target.value)}
                />
              </Field>
            </div>
          </Card>
        ))}
        {packages.length === 0 && <p className="text-sm text-stone-400">No packages yet.</p>}
      </div>

      <Card className="mt-6 p-4">
        <p className="font-semibold text-stone-900">Add a package</p>
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder="e.g. Half-Day Hire"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <PrimaryButton onClick={addPackage} disabled={!newName}>
            Add package
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
