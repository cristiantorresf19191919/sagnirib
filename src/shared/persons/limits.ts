/**
 * Shared person-domain limits (ADR-018).
 *
 * Lives outside `src/server/persons/` so client components (e.g. the
 * "Crear nueva modelo" form on the dashboard) can read the same bounds
 * the server validates against — without pulling `server-only` into a
 * Client Component bundle.
 *
 * Single source of truth: the server barrel (`@/server/persons`)
 * re-exports `PERSON_LIMITS` from here so existing server-side
 * imports keep working.
 */
export const PERSON_LIMITS = {
  displayNameMin: 3,
  displayNameMax: 64,
  /** Soft cap to bound dashboard rendering / queue payloads. */
  maxPersonsPerAccount: 50,
  /** Same shape as the verification path uid segment (ADR-014). */
  personIdRegex: /^[A-Za-z0-9_-]{6,128}$/,
} as const;
