// money.ts — integer-cents money handling.
//
// A spend gate that reasons in floating-point dollars is a spend gate with a
// rounding bug waiting to happen. All arithmetic in this module operates on
// integer cents; dollars only exist at the edges (parsing input, formatting
// for humans / the CSV). This is deliberate and load-bearing for correctness
// at the ceiling boundary (SPEC WS-B: "exactly at ceiling = allowed; one cent
// over = refused").

/** Parse a USD amount (number of dollars, or a numeric string) to integer cents. */
export function dollarsToCents(amount: number | string): number {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) {
    throw new Error(`invalid amount: ${JSON.stringify(amount)}`);
  }
  if (n < 0) {
    throw new Error(`amount must be non-negative, got ${n}`);
  }
  // Round to the nearest cent to absorb float representation noise
  // (e.g. 0.1 + 0.2). Math.round is safe here because inputs are bounded
  // to realistic spend magnitudes.
  const cents = Math.round(n * 100);
  return cents;
}

/** Format integer cents as a fixed 2-decimal USD string (no currency symbol). */
export function centsToDollarString(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`cents must be an integer, got ${cents}`);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`;
}
