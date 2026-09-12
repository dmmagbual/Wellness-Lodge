import { useEffect, useState } from "react";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { IconBed } from "@/components/icons";

const SIZE_CLASS = {
  sm: "h-10 w-10 rounded-lg",
  md: "h-14 w-14 rounded-xl",
  lg: "h-40 w-full rounded-2xl",
} as const;

/**
 * Room-category photo thumbnail -- rendered everywhere a booking shows up
 * (Dashboard, Queue, the bookings ledger, the drawer) so front desk staff
 * see the kind of room a guest booked at a glance, not just its name.
 *
 * `images[0]` is resolved two ways, matching RoomCategory's documented
 * shape and BookingDrawer's ReceiptImage precedent: a plain https:// URL
 * (today's seeded demo photos) is used directly; anything else is treated
 * as a Firebase Storage path and resolved via getDownloadURL (for when the
 * lodge uploads its own real photography later).
 */
export default function RoomThumb({
  images,
  size = "sm",
  onClick,
  className = "",
}: {
  images?: string[];
  size?: "sm" | "md" | "lg";
  /** When set, the thumbnail becomes clickable (e.g. to open a full photo lightbox). */
  onClick?: () => void;
  className?: string;
}) {
  const first = images?.[0];
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSrc(null);
    setError(false);
    if (!first) return;
    if (/^https?:\/\//i.test(first)) {
      setSrc(first);
      return;
    }
    let cancelled = false;
    getDownloadURL(storageRef(storage, first))
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [first]);

  const base = `${SIZE_CLASS[size]} shrink-0 overflow-hidden bg-ivory-100 ring-1 ring-stone-200/70 ${className}`;

  if (!first || error) {
    return (
      <div className={`${base} flex items-center justify-center text-stone-300`}>
        <IconBed className={size === "lg" ? "h-8 w-8" : "h-4 w-4"} />
      </div>
    );
  }

  if (!src) {
    return <div className={`${base} animate-pulse bg-stone-100`} />;
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`${base} block cursor-zoom-in transition hover:opacity-90`}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </button>
    );
  }

  return (
    <div className={base}>
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
