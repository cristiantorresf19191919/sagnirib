import type { SupportedLocale } from "@/core/branding/brand-config";
import { t } from "@/core/i18n/messages";

import { AccountLoadingTips } from "./AccountLoadingTips";
import { RouteSpinner } from "./RouteSpinner";

/**
 * Full-screen loading experience for signed-in surfaces (the account area and
 * the authenticated home fallback). A large, centred liquid loader anchors the
 * screen while a rotating strip of profile tips fills the wait with useful,
 * on-brand guidance instead of dead space.
 *
 * Server Component: the loader spins via CSS straight from streamed HTML; only
 * the tips rotator is a small client island.
 */
export function AccountLoadingScreen({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-4 py-12">
      <RouteSpinner label={t(locale, "loading.session")} size="lg" />
      <AccountLoadingTips />
    </div>
  );
}
