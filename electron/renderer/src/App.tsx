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
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="titlebar-drag flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2.5">
        <div className="titlebar-no-drag flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-stone-900">Wellness Lodge</span>
          <span className="text-xs text-stone-400">Front Desk &amp; Administration</span>
        </div>
        <div className="titlebar-no-drag flex items-center gap-3 text-sm">
          <span className="text-stone-600">
            {staff.name} <span className="text-stone-400">({staff.role.replaceAll("_", " ")})</span>
          </span>
          <button onClick={() => signOut(auth)} className="text-stone-500 hover:text-stone-800">
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-stone-200 bg-white px-4 py-2">
        {availableNav.map((n) => (
          <button
            key={n.key}
            onClick={() => setView(n.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              view === n.key ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {view === "dashboard" && <Dashboard role={staff.role} />}
        {view === "queue" && <Queue role={staff.role} />}
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
