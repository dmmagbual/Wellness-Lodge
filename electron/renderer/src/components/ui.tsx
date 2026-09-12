import type { ReactNode } from "react";
import { formatPGK } from "@wellness-lodge/shared";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_28px_-16px_rgba(28,25,23,0.16)] ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Consistent section title used across Dashboard and elsewhere: a small
 * tinted icon badge + a serif-accented heading + an optional live count.
 * One place to keep every section header looking like part of the same
 * system instead of each screen inventing its own heading markup.
 */
export function SectionHeading({
  icon,
  title,
  count,
  tone = "stone",
}: {
  icon?: ReactNode;
  title: string;
  count?: number;
  tone?: "stone" | "emerald" | "amber" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {icon && <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>}
      <h2 className="font-display text-[15px] font-semibold tracking-tight text-stone-900">
        {title}
        {typeof count === "number" && <span className="ml-1.5 font-sans text-sm font-normal text-stone-400">({count})</span>}
      </h2>
    </div>
  );
}

export function Price({ toea }: { toea: number }) {
  return <span className="font-semibold text-stone-900">{formatPGK(toea)}</span>;
}

export function Badge({ tone, children }: { tone: "amber" | "emerald" | "stone" | "red" | "blue"; children: ReactNode }) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    stone: "bg-stone-100 text-stone-700 ring-stone-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

// A booking's refund state lives entirely in `paymentStatus`, never in
// `status` (a refunded booking usually stays CONFIRMED/CANCELLED) -- so
// nothing ever showed it wherever the booking appears (search, recent list,
// dashboard, arrivals). Rendered next to the status badge everywhere a
// booking row is shown, and in BookingDrawer's header, so a pending or
// completed refund is traceable at a glance instead of only visible by
// opening the booking and reading the payment-status field.
export function PaymentStatusFlag({ paymentStatus }: { paymentStatus: string }) {
  if (paymentStatus === "REFUND_PENDING") return <Badge tone="red">REFUND PENDING</Badge>;
  if (paymentStatus === "REFUNDED") return <Badge tone="stone">REFUNDED</Badge>;
  return null;
}

export function PrimaryButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Small circular progress ring used for the dashboard's occupancy indicator
 * (rooms occupied / total active room inventory). Brass arc over a soft
 * emerald track -- the one place the gold accent stands in for real data
 * rather than pure decoration. Pure SVG, no chart library.
 */
export function OccupancyRing({ percent, size = 32 }: { percent: number; size?: number }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-emerald-100" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-brass-500 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

export function SecondaryButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">{children}</div>;
}
