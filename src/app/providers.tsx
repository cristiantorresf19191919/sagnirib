import { FavoritesProvider } from "@/features/favorites/store/use-favorites";

/**
 * Root composition for client-side providers. Add providers here only when
 * a feature actually needs them, per Addendum 002 §4 (Provider/Composition).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
