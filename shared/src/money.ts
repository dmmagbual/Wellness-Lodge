/**
 * Money helpers — PGK (Papua New Guinea Kina).
 * All monetary values are stored/transported as integer TOEA (1 Kina = 100 toea).
 * Never use floating point for money math.
 */

export function kinaToToea(kina: number): number {
  return Math.round(kina * 100);
}

export function toeaToKina(toea: number): number {
  return toea / 100;
}

export function formatPGK(toea: number): string {
  const kina = toea / 100;
  return "K" + kina.toLocaleString("en-PG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function addToea(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v), 0);
}
