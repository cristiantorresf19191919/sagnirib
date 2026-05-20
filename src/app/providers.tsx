import type { SupportedLocale } from "@/core/branding/brand-config";
import { LocaleProvider } from "@/core/i18n/LocaleProvider";
import { BackOnlinePill } from "@/features/favorites/components/BackOnlinePill";
import { FavoritesProvider } from "@/features/favorites/store/use-favorites";
import { SafeCheckinWatcher } from "@/features/safety/components/SafeCheckinWatcher";
import { Toaster } from "@/shared/ui/toast";

interface ProvidersProps {
  /** Locale resolved server-side by RootLayout. Threaded through
   *  LocaleProvider so any client component can call `useLocale()`. */
  locale: SupportedLocale;
  children: React.ReactNode;
}

/**
 * Root composition for client-side providers. Add providers here only when
 * a feature actually needs them, per Addendum 002 §4 (Provider/Composition).
 *
 *  - `LocaleProvider` — broadcasts the active locale (resolved server-side)
 *    to deep client components so they can call `useLocale()` + `t()`
 *    without prop-drilling through every parent.
 *  - `Toaster` — global notification stack; any client component can
 *    push via `import { toast } from "@/shared/ui/toast"`.
 *  - `BackOnlinePill` — retention surface that announces when a
 *    favorited listing flips to `availableNow`. Renders nothing for
 *    users with zero favorites.
 *  - `SafeCheckinWatcher` — polls localStorage every 15s while the
 *    tab is visible; surfaces a countdown banner while armed and an
 *    alert modal when a deadline crosses. Pure client-side; no
 *    network traffic at any point.
 */
export function Providers({ locale, children }: Readonly<ProvidersProps>) {
  return (
    <LocaleProvider value={locale}>
      <FavoritesProvider>
        {children}
        <Toaster />
        <BackOnlinePill />
        <SafeCheckinWatcher />
      </FavoritesProvider>
    </LocaleProvider>
  );
}
