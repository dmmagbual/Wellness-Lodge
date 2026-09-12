/**
 * Full-width, impossible-to-miss bar for "a reservation just arrived and
 * nobody has looked yet". Pairs with the soft repeating ring in
 * useNeedsActionAlert -- clicking this is what silences it. Rendered at the
 * App root (always mounted) rather than inside any one screen, so it shows
 * up no matter which view the front desk happens to be on.
 */
export default function NewReservationBanner({
  count,
  onAcknowledge,
}: {
  count: number;
  onAcknowledge: () => void;
}) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onAcknowledge}
      className="alert-banner-pulse flex w-full items-center justify-center gap-3 bg-red-600 px-4 py-3 text-sm font-bold tracking-wide text-white shadow-md transition hover:bg-red-700"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      <span>
        {count === 1 ? "NEW RESERVATION HAS ARRIVED" : `${count} NEW RESERVATIONS HAVE ARRIVED`}
      </span>
      <span className="font-normal text-red-100">— click to view &amp; silence</span>
    </button>
  );
}
