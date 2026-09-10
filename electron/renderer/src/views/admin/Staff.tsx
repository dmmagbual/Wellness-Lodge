import { useState } from "react";
import { collection } from "firebase/firestore";
import { db, callCreateStaffUser, callDeactivateStaffUser } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { StaffUser, StaffRole } from "@wellness-lodge/shared";
import { Badge, Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui";

const ROLES: StaffRole[] = ["FRONT_DESK", "MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"];

export default function AdminStaff() {
  const { data: staff } = useCollection<StaffUser>(() => collection(db, "users"), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("FRONT_DESK");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createUser() {
    setCreating(true);
    setError(null);
    try {
      await callCreateStaffUser({ name, email, role, temporaryPassword: password });
      setName("");
      setEmail("");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create this account.");
    } finally {
      setCreating(false);
    }
  }

  async function deactivate(uid: string) {
    const reason = window.prompt("Reason for deactivating this account?");
    if (!reason) return;
    await callDeactivateStaffUser({ uid, reason });
  }

  return (
    <div className="p-6">
      <Card>
        {staff.map((s) => (
          <div key={s.uid} className="flex items-center justify-between border-b border-stone-100 px-4 py-3 last:border-b-0">
            <div>
              <p className="font-medium text-stone-900">{s.name}</p>
              <p className="text-sm text-stone-500">{s.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="stone">{s.role.replaceAll("_", " ")}</Badge>
              <Badge tone={s.active ? "emerald" : "red"}>{s.active ? "Active" : "Deactivated"}</Badge>
              {s.active && (
                <SecondaryButton onClick={() => deactivate(s.uid)} className="text-xs">
                  Deactivate
                </SecondaryButton>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card className="mt-6 p-5">
        <p className="font-semibold text-stone-900">Add a staff account (Administrator only)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Share with the staff member securely.">
            <input type="text" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3">
          <PrimaryButton onClick={createUser} disabled={!name || !email || password.length < 8 || creating}>
            {creating ? "Creating…" : "Create account"}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
