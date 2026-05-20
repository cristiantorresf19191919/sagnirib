/**
 * Neutral i18n constants — safe to import from both server and client
 * code. Keeping them in a separate file avoids the "server-only"
 * pollution that happens when a Server Action transitively pulls in
 * `locale.ts` (which depends on `next/headers`).
 */
export const LOCALE_COOKIE = "biringas:locale";
