import { BackOnlinePill } from "@/features/favorites/components/BackOnlinePill";
import { FavoritesProvider } from "@/features/favorites/store/use-favorites";
import { Toaster } from "@/shared/ui/toast";

/**
 * Root composition for client-side providers. Add providers here only when
 * a feature actually needs them, per Addendum 002 §4 (Provider/Composition).
 *
 *  - `Toaster` — global notification stack; any client component can
 *    push via `import { toast } from "@/shared/ui/toast"`.
 *  - `BackOnlinePill` — retention surface that announces when a
 *    favorited listing flips to `availableNow`. Renders nothing for
 *    users with zero favorites.
 *
 * `initialFavorites` is supplied by the Server Component layout (ADR-013).
 * The provider merges it with localStorage on first paint so signed-in
 * users see their cross-device shortlist without a hydration flash.
 *
 * Safe Check-in (SafeCheckinWatcher) is temporarily disabled. To
 * re-enable, restore the import and mount it alongside BackOnlinePill;
 * the feature code under `src/features/safety/` is preserved intact.
 */
export function Providers({
  children,
  initialFavorites,
}: {
  children: React.ReactNode;
  initialFavorites?: ReadonlyArray<string>;
}) {
  return (
    <FavoritesProvider initialFavorites={initialFavorites}>
      {children}
      <Toaster />
      <BackOnlinePill />
    </FavoritesProvider>
  );
}
