/**
 * Shared verification-domain constants (ADR-014 + ADR-018 amendment).
 *
 * Lives outside `src/server/verification/` so the KYC wizard (a
 * Client Component) can read the same bounds the server validates
 * against — without pulling `server-only` into a Client bundle.
 *
 * Same pattern as `src/shared/persons/limits.ts`: the single source
 * of truth is here; the server barrel
 * (`@/server/verification`) re-exports these from `types.ts` so
 * existing server-side imports keep working unchanged.
 */

/**
 * Identity document kinds we accept on the KYC form.
 *
 *   - `CC`        — Cédula de Ciudadanía (Colombian ID, numeric).
 *   - `CE`        — Cédula de Extranjería (Colombian foreign-resident
 *                   ID, numeric).
 *   - `PASSPORT`  — International passport (alphanumeric).
 *
 * Adding a new type? It must be added here AND mirrored in the
 * wizard's i18n strings (`verificacion.wizard.doc.type.<KEY>`).
 */
export const DOCUMENT_TYPES = ["CC", "CE", "PASSPORT"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * Document number length bounds, measured AFTER normalization
 * (uppercase + alphanumeric only). CC/CE are typically 8–10 digits;
 * passports vary by issuing country. The bounds are permissive on
 * purpose — the admin's manual review catches malformed numbers; the
 * schema just prevents obvious junk.
 */
export const VERIFICATION_DOCUMENT_LIMITS = {
  documentNumberMin: 5,
  documentNumberMax: 20,
} as const;
