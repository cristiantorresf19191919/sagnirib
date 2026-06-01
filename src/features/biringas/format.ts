/**
 * Pure formatters for biringa listings. Lives outside `src/server/` because
 * it has no IO and is safely callable from server or client components.
 */
const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPriceCop(value: number): string {
  return COP_FORMATTER.format(value);
}

const THOUSANDS_FORMATTER = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

/**
 * Groups a raw integer with Colombian thousand separators (dots):
 * `200000 → "200.000"`. Used by numeric inputs that store raw digits in
 * state but display the grouped value. Returns "" for non-finite input.
 */
export function formatThousands(value: number): string {
  if (!Number.isFinite(value)) return "";
  return THOUSANDS_FORMATTER.format(value);
}

/**
 * Groups a raw Colombian mobile number into readable triads:
 * `3237992985 → "323 799 2985"` (3-3-4). Strips non-digits and caps at the
 * 10-digit national length. Used by the phone input, which stores raw digits
 * in state and displays the grouped value.
 */
export function formatPhoneCo(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
  return parts.filter(Boolean).join(" ");
}

export function formatPricePerHour(value: number): string {
  return `${formatPriceCop(value)} / hora`;
}

/**
 * Compact price for narrow card surfaces — drops the "/ hora" suffix so
 * the value never wraps to a second line inside a 160-180px card column.
 * The "/ h" suffix preserves the per-hour semantic at minimum width.
 */
export function formatPricePerHourCompact(value: number): string {
  return `${formatPriceCop(value)} / h`;
}
