import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import Login from "@/views/Login";
import Dashboard from "@/views/Dashboard";
import Queue from "@/views/Queue";
import Enquiries from "@/views/Enquiries";
import AdminRooms from "@/views/admin/Rooms";
import AdminStaff from "@/views/admin/Staff";
import AdminSettings from "@/views/admin/Settings";
import AdminAuditLog from "@/views/admin/AuditLog";
import AdminReports from "@/views/admin/Reports";

type View = "dashboard" | "queue" | "enquiries" | "rooms" | "staff" | "settings" | "audit" | "reports";
type QueueTab = "action" | "arrivals" | "inhouse" | "search";

const NAV: { key: View; label: string; roles: string[] }[] = [
  { key: "dashboard", label: "Dashboard", roles: ["FRONT_DESK", "MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"] },
  { key: "queue", label: "Front Desk", roles: ["FRONT_DESK", "MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"] },
  { key: "enquiries", label: "Enquiries", roles: ["FRONT_DESK", "MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"] },
  { key: "rooms", label: "Rooms & Rates", roles: ["MANAGER", "ADMINISTRATOR", "CONTENT_ADMIN"] },
  { key: "reports", label: "Reports", roles: ["MANAGER", "ADMINISTRATOR"] },
  { key: "staff", label: "Staff", roles: ["ADMINISTRATOR"] },
  { key: "audit", label: "Audit Log", roles: ["MANAGER", "ADMINISTRATOR"] },
  { key: "settings", label: "Settings", roles: ["MANAGER", "ADMINISTRATOR"] },
];

export default function App() {
  const { loading, user, staff } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  // Set right before switching to "queue" so Queue mounts with the right tab
  // already selected -- Queue is unmounted/remounted on every view switch
  // (conditional render below, not kept alive), so a fresh initial state each
  // time is enough; no need to keep this in sync afterwards.
  const [queueInitialTab, setQueueInitialTab] = useState<QueueTab>("action");

  function goToQueueTab(tab: QueueTab) {
    setQueueInitialTab(tab);
    setView("queue");
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-stone-400">Loading…</div>;
  }

  if (!user) return <Login />;

  if (!staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-stone-900">No staff profile found for this account.</p>
        <p className="max-w-sm text-sm text-stone-500">
          Ask an administrator to create your account from Staff → Add a staff account, or use one of the demo
          accounts listed on the sign-in screen.
        </p>
        <button onClick={() => signOut(auth)} className="mt-2 text-sm font-medium text-emerald-700 underline">
          Sign out
        </button>
      </div>
    );
  }

  if (!staff.active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-red-700">This account has been deactivated.</p>
        <button onClick={() => signOut(auth)} className="mt-2 text-sm font-medium text-emerald-700 underline">
          Sign out
        </button>
      </div>
    );
  }

  const availableNav = NAV.filter((n) => n.roles.includes(staff.role));

  return (
    <div className="flex h-screen flex-col bg-ivory">
      {/* Deep forest header (deepened from stone/emerald-700) with a thin
          brass trim line underneath -- the single "gold line" hospitality
          signature that ties the header to the calendar's brass accents
          without adding gold anywhere status/payment colors already own. */}
      <header className="titlebar-drag flex items-center justify-between border-b-2 border-brass-600 bg-gradient-to-b from-emerald-950 to-emerald-900 px-5 py-3 shadow-sm">
        <div className="titlebar-no-drag flex items-baseline gap-2.5">
          <span className="font-display text-base font-semibold tracking-tight text-white">Wellness Lodge</span>
          <span className="text-xs text-emerald-200/70">Front Desk &amp; Administration</span>
        </div>
        <div className="titlebar-no-drag flex items-center gap-3 text-sm">
          <span className="text-emerald-100/90">
            {staff.name} <span className="text-emerald-300/60">({staff.role.replaceAll("_", " ")})</span>
          </span>
          <button onClick={() => signOut(auth)} className="text-emerald-200/70 transition hover:text-white">
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-stone-200/80 bg-ivory px-4 py-2 shadow-[0_1px_0_rgba(28,25,23,0.02)]">
        {availableNav.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              view === n.key
                ? "bg-emerald-800 text-white shadow-sm ring-1 ring-brass-400/50"
                : "text-stone-600 hover:bg-white"
            }`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {view === "dashboard" && (
          <Dashboard
            role={staff.role}
            onGoToInHouse={() => goToQueueTab("inhouse")}
            onGoToEnquiries={() => setView("enquiries")}
          />
        )}
        {view === "queue" && <Queue role={staff.role} initialTab={queueInitialTab} />}
        {view === "enquiries" && <Enquiries />}
        {view === "rooms" && <AdminRooms />}
        {view === "reports" && <AdminReports />}
        {view === "staff" && <AdminStaff />}
        {view === "settings" && <AdminSettings />}
        {view === "audit" && <AdminAuditLog />}
      </main>
    </div>
  );
}
