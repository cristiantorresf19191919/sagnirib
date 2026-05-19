import "server-only";

/**
 * Listing-report domain contract.
 *
 * Marketplaces in this category MUST give buyers a discreet "report"
 * affordance — fake photos, harassment, suspected coercion, scam,
 * underage. This is the contract that backs the report modal.
 *
 * Mock-backed today (in-memory store); when the Firebase adapter ships
 * a `listing_reports/{auto-id}` document with the same shape, the
 * adapter swap is invisible to features.
 */

export type ReportReason =
  | "fake_photos"
  | "scam"
  | "harassment"
  | "minor_concern"
  | "underage"
  | "spam"
  | "other";

export interface ReportListingInput {
  listingSlug: string;
  reason: ReportReason;
  /** Freeform detail — required for `other`, optional otherwise. */
  detail?: string;
}

export interface ReportListingRecord extends ReportListingInput {
  id: string;
  reporterUid: string | null;
  submittedAt: string;
  /** Triaged → action taken: open / dismissed / actioned. */
  status: "open" | "dismissed" | "actioned";
}

export const REPORT_LIMITS = {
  detailMax: 1000,
} as const;

export const REPORT_REASONS: ReadonlyArray<{
  value: ReportReason;
  label: string;
  hint: string;
}> = [
  {
    value: "fake_photos",
    label: "Fotos no coinciden",
    hint: "Las fotos del perfil no representan a la persona del encuentro.",
  },
  {
    value: "scam",
    label: "Sospecha de estafa",
    hint: "Pidieron pago por adelantado o algo no coincide con lo publicado.",
  },
  {
    value: "harassment",
    label: "Acoso o falta de respeto",
    hint: "Comportamiento agresivo, presión indebida, mensajes hostiles.",
  },
  {
    value: "minor_concern",
    label: "Preocupación por seguridad",
    hint: "Indicios de que la persona no está libre de actuar por su voluntad.",
  },
  {
    value: "underage",
    label: "Sospecha de menor de edad",
    hint: "Alguien parece tener menos de 18 años. Revisión prioritaria.",
  },
  {
    value: "spam",
    label: "Spam o duplicado",
    hint: "Perfil que parece automatizado o copia de otro.",
  },
  {
    value: "other",
    label: "Otro",
    hint: "Describe la situación en el campo de abajo.",
  },
];
