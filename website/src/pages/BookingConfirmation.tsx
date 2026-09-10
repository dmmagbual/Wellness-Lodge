import { Navigate } from "react-router-dom";

// Guests reach their booking either right after submitting it (handled
// inline in Book.tsx) or later via /booking-lookup (reference + email).
// This route exists for a bookmarked/emailed link and simply routes guests
// to the lookup page rather than duplicating the lookup form.
export default function BookingConfirmation() {
  return <Navigate to="/booking-lookup" replace />;
}
