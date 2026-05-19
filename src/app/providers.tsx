import { FavoritesProvider } from "@/features/favorites/store/use-favorites";
import { Toaster } from "@/shared/ui/toast";

/**
 * Root composition for client-side providers. Add providers here only when
 * a feature actually needs them, per Addendum 002 §4 (Provider/Composition).
 *
 * `Toaster` is mounted once at the root so any client component (or
 * server-action callback executed in a client transition) can fire a
 * toast via `import { toast } from "@/shared/ui/toast"`.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      {children}
      <Toaster />
    </FavoritesProvider>
  );
}
