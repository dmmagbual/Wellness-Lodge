import { useState } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import { formatPGK } from "@wellness-lodge/shared";
import type { MenuItem } from "@wellness-lodge/shared";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass, Badge } from "@/components/ui";

/** Menu items live in the `menuItems` collection — the exact same collection
 * the public website reads from (fetchMenu() in website/src/lib/data.ts), so
 * anything saved here appears on the live Restaurant & Cafe page with no
 * further wiring: this screen IS the source of truth for that page. */
export default function SettingsMenu() {
  const { data: items } = useCollection<MenuItem>(() => collection(db, "menuItems"), []);

  async function toggleActive(item: MenuItem) {
    await updateDoc(doc(db, "menuItems", item.id), { active: !item.active });
  }

  async function updateField(item: MenuItem, field: keyof MenuItem, value: unknown) {
    await updateDoc(doc(db, "menuItems", item.id), { [field]: value });
  }

  function updateDietary(item: MenuItem, raw: string) {
    const dietary = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(item, "dietary", dietary);
  }

  const [newOutlet, setNewOutlet] = useState<"RESTAURANT" | "CAFE">("RESTAURANT");
  const [newCategory, setNewCategory] = useState("");
  const [newName, setNewName] = useState("");

  async function addItem() {
    if (!newName) return;
    await addDoc(collection(db, "menuItems"), {
      outlet: newOutlet,
      category: newCategory || "Main",
      name: newName,
      description: "",
      priceToea: 0,
      dietary: [],
      active: true,
    });
    setNewName("");
    setNewCategory("");
  }

  function renderColumn(outlet: "RESTAURANT" | "CAFE", label: string) {
    const mine = items.filter((m) => m.outlet === outlet);
    return (
      <div>
        <p className="font-semibold text-stone-900">{label}</p>
        <div className="mt-3 space-y-3">
          {mine.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={m.active ? "emerald" : "stone"}>{m.active ? "Active" : "Inactive"}</Badge>
                  <span className="text-xs text-stone-400">{formatPGK(m.priceToea)}</span>
                </div>
                <SecondaryButton onClick={() => toggleActive(m)}>
                  {m.active ? "Deactivate" : "Activate"}
                </SecondaryButton>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={inputClass}
                    defaultValue={m.name}
                    onBlur={(e) => updateField(m, "name", e.target.value)}
                  />
                </Field>
                <Field label="Category">
                  <input
                    className={inputClass}
                    defaultValue={m.category}
                    onBlur={(e) => updateField(m, "category", e.target.value)}
                  />
                </Field>
                <Field label="Description" hint="Shown under the item name on the website.">
                  <textarea
                    className={inputClass}
                    rows={2}
                    defaultValue={m.description}
                    onBlur={(e) => updateField(m, "description", e.target.value)}
                  />
                </Field>
                <Field label="Price (PGK)">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    defaultValue={(m.priceToea / 100).toFixed(2)}
                    onBlur={(e) => updateField(m, "priceToea", Math.round(parseFloat(e.target.value || "0") * 100))}
                  />
                </Field>
                <Field label="Dietary tags" hint="Comma separated, e.g. Vegetarian, Gluten-free">
                  <input
                    className={inputClass}
                    defaultValue={m.dietary.join(", ")}
                    onBlur={(e) => updateDietary(m, e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          ))}
          {mine.length === 0 && <p className="text-sm text-stone-400">No {label.toLowerCase()} items yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-500">
        This is the exact menu shown on the public Restaurant &amp; Cafe page — changes here appear live on the
        website. Deactivated items are hidden from guests but kept on file.
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        {renderColumn("RESTAURANT", "Restaurant")}
        {renderColumn("CAFE", "Cafe")}
      </div>

      <Card className="mt-6 p-4">
        <p className="font-semibold text-stone-900">Add a menu item</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <select
            className={inputClass}
            value={newOutlet}
            onChange={(e) => setNewOutlet(e.target.value as "RESTAURANT" | "CAFE")}
          >
            <option value="RESTAURANT">Restaurant</option>
            <option value="CAFE">Cafe</option>
          </select>
          <input
            className={inputClass}
            placeholder="Category, e.g. Main"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <PrimaryButton onClick={addItem} disabled={!newName}>
            Add item
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
