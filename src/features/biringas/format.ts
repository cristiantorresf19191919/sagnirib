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

export function formatPricePerHour(value: number): string {
  return `${formatPriceCop(value)} / hora`;
}
