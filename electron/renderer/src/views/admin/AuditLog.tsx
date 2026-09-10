import { collection, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { AuditLogEntry } from "@wellness-lodge/shared";
import { Card, EmptyState } from "@/components/ui";

type AuditRow = AuditLogEntry & { timestampIso: string };

export default function AdminAuditLog() {
  const { data } = useCollection<AuditRow>(
    () => query(collection(db, "auditLog"), orderBy("timestampIso", "desc"), limit(200)),
    []
  );

  return (
    <div className="p-6">
      <p className="text-sm text-stone-500">
        Every sensitive action — confirmations, rejections, cancellations, overrides, rate changes and staff
        changes — is recorded here with who did it, when, and why.
      </p>
      <Card className="mt-5 overflow-x-auto">
        {data.length === 0 && <EmptyState>No audit entries yet.</EmptyState>}
        {data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Actor</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id} className="border-b border-stone-100 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2 text-stone-500">{new Date(e.timestampIso).toLocaleString()}</td>
                  <td className="px-4 py-2">{e.actorName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                  <td className="px-4 py-2">{e.targetId}</td>
                  <td className="px-4 py-2 text-stone-500">{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
