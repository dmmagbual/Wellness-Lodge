import { nightsBetween } from "./dates";
import { addToea } from "./money";
import type { PriceSnapshot, RatePeriod, RateSnapshotNight } from "./types";

export class NoRateForNightError extends Error {
  constructor(public date: string, public categoryId: string) {
    super(`No active rate covers ${date} for category ${categoryId}`);
    this.name = "NoRateForNightError";
  }
}

/** Finds the rate period covering a single night for a category. Throws if none found. */
export function findRateForNight(
  date: string,
  categoryId: string,
  ratePeriods: RatePeriod[]
): RatePeriod {
  const candidates = ratePeriods.filter(
    (r) => r.categoryId === categoryId && r.active && r.startDate <= date && date <= r.endDate
  );
  if (candidates.length === 0) throw new NoRateForNightError(date, categoryId);
  // If multiple periods overlap (shouldn't happen — periods are validated not to
  // overlap on save) prefer the most specific (shortest) period, measured in
  // actual elapsed days rather than string length/ordering.
  const spanDays = (r: RatePeriod) =>
    (new Date(r.endDate + "T00:00:00Z").getTime() - new Date(r.startDate + "T00:00:00Z").getTime()) /
    (24 * 60 * 60 * 1000);
  candidates.sort((a, b) => spanDays(a) - spanDays(b));
  return candidates[0];
}

export interface PricingInput {
  categoryId: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  baseOccupancy: number; // adults included before extra-adult charge applies
  addOnsToea?: number;
  ratePeriods: RatePeriod[];
  gstEnabled: boolean;
  gstPercent: number;
  depositPercent: number;
}

export function computePriceSnapshot(input: PricingInput): PriceSnapshot {
  const nightDates = nightsBetween(input.checkIn, input.checkOut);
  if (nightDates.length === 0) {
    throw new Error("Stay must be at least one night");
  }

  const nights: RateSnapshotNight[] = nightDates.map((date) => {
    const rate = findRateForNight(date, input.categoryId, input.ratePeriods);
    return {
      date,
      rateToea: rate.nightlyRateToea,
      ratePeriodId: rate.id,
      ratePeriodLabel: rate.label,
    };
  });

  const roomToea = addToea(...nights.map((n) => n.rateToea));

  const extraAdults = Math.max(0, input.adults - input.baseOccupancy);
  // Extra-adult and child charges use the rate period covering the first night
  // as the representative rate (consistent, simple, documented assumption).
  const firstRate = findRateForNight(nightDates[0], input.categoryId, input.ratePeriods);
  const extraAdultChargeToea = extraAdults * firstRate.extraAdultToea * nights.length;
  const childChargeToea = input.children * firstRate.childRateToea * nights.length;
  const addOnsToea = input.addOnsToea ?? 0;

  const subtotalToea = addToea(roomToea, extraAdultChargeToea, childChargeToea, addOnsToea);
  const gstToea = input.gstEnabled ? Math.round((subtotalToea * input.gstPercent) / 100) : 0;
  const totalToea = addToea(subtotalToea, gstToea);
  const depositToea = Math.round((totalToea * input.depositPercent) / 100);
  const balanceToea = totalToea - depositToea;

  return {
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    nights,
    adults: input.adults,
    children: input.children,
    extraAdultChargeToea,
    childChargeToea,
    addOnsToea,
    subtotalToea,
    gstEnabled: input.gstEnabled,
    gstToea,
    totalToea,
    depositPercent: input.depositPercent,
    depositToea,
    balanceToea,
    currency: "PGK",
  };
}

/** WL-XXXXXX booking reference: date-based prefix + random suffix, human-readable. */
export function generateBookingRef(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `WL-${stamp}${rand}`.slice(0, 12);
}
