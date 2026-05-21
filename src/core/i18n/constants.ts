/**
 * Neutral i18n constants and pure helpers — safe to import from both
 * server and client code. Keeping them in a separate file avoids the
 * `server-only` pollution that happens when a Server Action transitively
 * pulls in `locale.ts` (which depends on `next/headers`).
 */
import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

export const LOCALE_COOKIE = "biringas:locale";

const SUPPORTED = new Set<SupportedLocale>(brandConfig.supportedLocales);

export function isSupportedLocale(
  value: string | undefined,
): value is SupportedLocale {
  return !!value && SUPPORTED.has(value as SupportedLocale);
}
