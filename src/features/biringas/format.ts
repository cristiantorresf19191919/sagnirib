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
