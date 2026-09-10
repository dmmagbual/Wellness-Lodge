import { useState } from "react";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/useCollection";
import type { Enquiry, EnquiryType } from "@wellness-lodge/shared";
import { Badge, Card, EmptyState } from "@/components/ui";

const TYPE_LABEL: Record<EnquiryType, string> = {
  CAR_RENTAL: "Car rental",
  FUNCTION_HALL: "Function hall",
  RESTAURANT_CAFE: "Restaurant / Cafe",
  CATERING: "Catering",
  GENERAL: "General",
};

const STATUS_TONE: Record<string, "amber" | "emerald" | "stone" | "blue"> = {
  NEW: "amber",
  IN_PROGRESS: "blue",
  QUOTED: "emerald",
  CLOSED: "stone",
};

export default function Enquiries() {
  const [filter, setFilter] = useState<"OPEN" | "ALL">("OPEN");

  const { data } = useCollection<Enquiry>(
    () => query(collection(db, "enquiries"), orderBy("createdAt", "desc")),
    []
  );

  const list = filter === "OPEN" ? data.filter((e) => e.status !== "CLOSED") : data;

  async function setStatus(id: string, status: Enquiry["status"]) {
    await updateDoc(doc(db, "enquiries", id), { status });
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("OPEN")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === "OPEN" ? "bg-emerald-700 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}
        >
          Open
        </button>
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === "ALL" ? "bg-emerald-700 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}
        >
          All
        </button>
      </div>

      <Card className="mt-5">
        {list.length === 0 && <EmptyState>No enquiries.</EmptyState>}
        {list.map((e) => (
          <div key={e.id} className="border-b border-stone-100 px-4 py-4 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="stone">{TYPE_LABEL[e.type]}</Badge>
                <Badge tone={STATUS_TONE[e.status]}>{e.status.replaceAll("_", " ")}</Badge>
              </div>
              <p className="text-xs text-stone-500">{new Date(e.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-2 font-semibold text-stone-900">{e.name}</p>
            <p className="text-sm text-stone-600">
              {e.email} &middot; {e.phone} {e.preferredDate && `· Preferred date: ${e.preferredDate}`}
            </p>
            <p className="mt-1 text-sm text-stone-700">{e.message}</p>
            <div className="mt-3 flex gap-2">
              {(["NEW", "IN_PROGRESS", "QUOTED", "CLOSED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(e.id, s)}
                  disabled={e.status === s}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 disabled:cursor-default disabled:bg-stone-100 disabled:text-stone-400"
                >
                  Mark {s.replaceAll("_", " ").toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
