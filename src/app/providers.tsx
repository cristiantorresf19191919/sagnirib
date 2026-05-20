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
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      {children}
      <Toaster />
      <BackOnlinePill />
    </FavoritesProvider>
  );
}
