import { MotionConfig } from "framer-motion";

import { FavoritesProvider } from "@/features/favorites/store/use-favorites";
import { Toaster } from "@/shared/ui/toast";

/**
 * Root composition for client-side providers. Add providers here only when
 * a feature actually needs them, per Addendum 002 §4 (Provider/Composition).
 *
 *  - `Toaster` — global notification stack; any client component can
 *    push via `import { toast } from "@/shared/ui/toast"`.
 *
 * Safe Check-in (`SafeCheckinWatcher`) is intentionally NOT mounted for the
 * MVP. The feature lives under `src/features/safety/`; re-add the import +
 * `<SafeCheckinWatcher />` below to bring it back.
 *
 * `initialFavorites` is supplied by the Server Component layout (ADR-013).
 * The provider merges it with localStorage on first paint so signed-in
 * users see their cross-device shortlist without a hydration flash.
 */
export function Providers({
  children,
  initialFavorites,
}: {
  children: React.ReactNode;
  initialFavorites?: ReadonlyArray<string>;
}) {
  return (
    // App-wide motion settings. `reducedMotion="user"` tells framer-motion
    // to honor `prefers-reduced-motion` internally so individual components
    // never need to branch on `useReducedMotion()` at render time — that
    // branching causes SSR/CSR hydration mismatches because the hook
    // returns `null` on the server and a boolean on the client.
    <MotionConfig reducedMotion="user">
      <FavoritesProvider initialFavorites={initialFavorites}>
        {children}
        <Toaster />
      </FavoritesProvider>
    </MotionConfig>
  );
}
