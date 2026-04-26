/**
 * Root composition for client-side providers. Empty by default — providers
 * (theme, query client, motion, analytics) are added only when a feature
 * actually needs them, per Addendum 002 §4 (Provider/Composition).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
