/**
 * Wellness Lodge — shared domain types.
 * Used by: firebase/functions, website, electron.
 * Money is always an integer number of TOEA (1 PGK / Kina = 100 toea).
 * Never use floating point for money — see shared/src/money.ts.
 */

// ---------------------------------------------------------------------------
// Roles & staff
// ---------------------------------------------------------------------------

export type StaffRole = "FRONT_DESK" | "MANAGER" | "ADMINISTRATOR" | "CONTENT_ADMIN";

export interface StaffUser {
  uid: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string; // ISO
  deactivatedAt?: string | null;
}

// ---------------------------------------------------------------------------
// Rooms, categories, rates
// ---------------------------------------------------------------------------

export interface RoomCategory {
  id: string;
  name: string; // e.g. "Deluxe Garden Room"
  slug: string;
  description: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedType: string;
  sizeSqm?: number;
  amenities: string[];
  images: string[]; // storage paths or placeholder URLs
  totalRooms: number; // pooled inventory count for this category
  active: boolean;
  sortOrder: number;
}

export interface Room {
  id: string;
  categoryId: string;
  code: string; // internal room number, e.g. "101"
  active: boolean; // false = out of service
  outOfServiceReason?: string;
}

export interface RatePeriod {
  id: string;
  categoryId: string;
  label: string; // "Standard", "Peak season", "Corporate"
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string; // YYYY-MM-DD inclusive
  nightlyRateToea: number;
  extraAdultToea: number;
  childRateToea: number;
  minStayNights: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export type BookingStatus =
  | "DRAFT"
  | "AWAITING_RECEIPT" // guest chose bank transfer, receipt not yet uploaded
  | "AWAITING_FRONT_DESK" // receipt uploaded OR pay-at-desk requested, staff must act
  | "HELD" // pay-at-desk accepted, 12h hold running
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentMethod = "BANK_TRANSFER" | "PAY_AT_FRONT_DESK";

export type PaymentStatus =
  | "UNPAID"
  | "RECEIPT_SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "REFUND_PENDING"
  | "REFUNDED";

/** Statuses that hold inventory (must match Cloud Functions logic exactly). */
export const INVENTORY_LOCKING_STATUSES: BookingStatus[] = ["HELD", "CONFIRMED", "CHECKED_IN"];

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface RateSnapshotNight {
  date: string; // YYYY-MM-DD
  rateToea: number;
  ratePeriodId: string;
  ratePeriodLabel: string;
}

/** Frozen at booking time so later rate changes never rewrite history. */
export interface PriceSnapshot {
  categoryId: string;
  categoryName: string;
  nights: RateSnapshotNight[];
  adults: number;
  children: number;
  extraAdultChargeToea: number;
  childChargeToea: number;
  addOnsToea: number;
  subtotalToea: number;
  gstEnabled: boolean;
  gstToea: number;
  totalToea: number;
  depositPercent: number;
  depositToea: number;
  balanceToea: number;
  currency: "PGK";
}

export interface Booking {
  id: string;
  bookingRef: string; // WL-XXXXXX
  categoryId: string;
  roomId?: string | null; // assigned at check-in, not at booking time
  guest: GuestDetails;
  // Denormalized lowercase copy of guest.name, set at creation, used only for
  // case-insensitive front-desk search (Firestore has no case-insensitive or
  // "contains" query, and guest names are typed in all sorts of casing).
  // Optional because bookings created before this field existed don't have
  // it — they just won't turn up in a name search until re-saved.
  guestNameLower?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  price: PriceSnapshot;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  holdExpiresAt?: string | null; // ISO — set when status = HELD
  receiptDeadlineAt?: string | null; // ISO — set when status = AWAITING_RECEIPT
  confirmedBy?: string | null; // staff uid
  confirmedAt?: string | null;
  cancelledReason?: string | null;
  refundedBy?: string | null; // staff uid — set when paymentStatus becomes REFUNDED
  refundedAt?: string | null;
  source: "WEBSITE" | "FRONT_DESK" | "PHONE" | "WALK_IN";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Payments / receipts
// ---------------------------------------------------------------------------

export type ReceiptStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface PaymentReceipt {
  id: string;
  bookingId: string;
  bookingRef: string;
  storagePath: string;
  amountStated: number; // toea, as guest reports
  uploadedAt: string;
  status: ReceiptStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

// ---------------------------------------------------------------------------
// Nightly inventory counters (one doc per category per night)
// ---------------------------------------------------------------------------

export interface NightlyInventory {
  categoryId: string;
  date: string; // YYYY-MM-DD
  totalRooms: number;
  held: number;
  booked: number; // CONFIRMED / CHECKED_IN
}

// ---------------------------------------------------------------------------
// Additional lodge services — information / enquiry scope (Phase 2 launch)
// ---------------------------------------------------------------------------

export interface CarRentalVehicle {
  id: string;
  name: string;
  category: string; // sedan, SUV, van...
  dailyRateToea: number;
  seats: number;
  transmission: "AUTOMATIC" | "MANUAL";
  images: string[];
  inclusions: string[];
  requirements: string[]; // licence, deposit, age, etc.
  active: boolean;
}

export interface FunctionHallPackage {
  id: string;
  name: string;
  capacitySeated: number;
  capacityStanding: number;
  priceFromToea: number;
  inclusions: string[];
  images: string[];
  active: boolean;
}

export interface MenuItem {
  id: string;
  outlet: "RESTAURANT" | "CAFE";
  category: string;
  name: string;
  description: string;
  priceToea: number;
  dietary: string[];
  active: boolean;
}

export interface PastEvent {
  id: string;
  title: string;
  category: string; // Wedding, Conference, Birthday...
  eventDate: string;
  description: string;
  images: string[];
  approved: boolean;
  sortOrder: number;
}

export type EnquiryType = "CAR_RENTAL" | "FUNCTION_HALL" | "RESTAURANT_CAFE" | "CATERING" | "GENERAL";

export interface Enquiry {
  id: string;
  type: EnquiryType;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string | null;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "QUOTED" | "CLOSED";
  createdAt: string;
  handledBy?: string | null;
}

// ---------------------------------------------------------------------------
// Settings (site-wide editable copy / config)
// ---------------------------------------------------------------------------

export interface LodgeSettings {
  lodgeName: string;
  tagline: string;
  phone: string;
  reservationsPhone: string;
  whatsapp: string;
  email: string;
  reservationsEmail: string;
  address: string;
  mapUrl: string;
  checkInTime: string;
  checkOutTime: string;
  bankAccountName: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  bankSwift?: string;
  receiptDeadlineHours: number; // default 48
  payAtDeskHoldHours: number; // default 12
  depositPercent: number; // 0-100
  gstEnabled: boolean;
  gstPercent: number;
  cancellationPolicy: string;
  privacyNotice: string;
  socials: { facebook?: string; instagram?: string; tiktok?: string };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  action: string; // e.g. "booking.verifyPayment"
  targetType: string; // "booking" | "rate" | "user" ...
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  timestamp: string;
}
