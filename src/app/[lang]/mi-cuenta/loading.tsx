import { readLocale } from "@/core/i18n/locale";
import { AccountLoadingScreen } from "@/shared/layout/AccountLoadingScreen";

/**
 * Route-level loading fallback for the account area (`/mi-cuenta` and its
 * children: borradores, editar, comentarios).
 *
 * Without this, those routes inherited `[lang]/loading.tsx` — the public
 * catalog skeleton — which is the wrong shape for an account surface. The
 * dashboard is always behind auth and does several Firestore reads (drafts +
 * persons + referral + published-listing lookups), so the wait is real; the
 * brand spinner keeps it calm and on-brand instead of flashing a catalog grid.
 */
export default async function Loading() {
  const locale = await readLocale();
  return (
    <main
      data-testid="mi-cuenta-loading"
      className="flex min-h-[60vh] flex-col bg-[var(--color-background)]"
    >
      <AccountLoadingScreen locale={locale} />
    </main>
  );
}
