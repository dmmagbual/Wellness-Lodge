/**
 * Date helpers for stay ranges. Dates are always plain "YYYY-MM-DD" strings
 * (no time, no timezone) — a stay is a set of calendar nights, and PNG runs
 * a single timezone (Pacific/Port_Moresby, UTC+10), so this avoids all
 * timezone-conversion bugs in availability and hold-expiry logic.
 */

/** Returns every night of the stay as YYYY-MM-DD, i.e. [checkIn, checkOut). */
export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  let cur = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (cur < end) {
    nights.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return nights;
}

export function nightCount(checkIn: string, checkOut: string): number {
  return nightsBetween(checkIn, checkOut).length;
}

export function isValidDateStr(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d + "T00:00:00Z").getTime());
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addHoursIso(hours: number, from: Date = new Date()): string {
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}
