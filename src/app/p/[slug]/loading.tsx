import { Container } from "@/shared/design-system/components/Container";

/**
 * Route-level skeleton for `/p/[slug]`. Mirrors the actual profile shape —
 * back-link + share row at the top, then the 12-column grid that splits
 * into gallery (left) + dossier (right) on lg+. Pulse animation is
 * CSS-only so SSR ships it without JS.
 */
export default function Loading() {
  return (
    <main className="relative isolate flex flex-1 flex-col" data-testid="profile-loading">
      <Container
        width="wide"
        className="flex items-center justify-between gap-4 pt-8 sm:pt-10"
      >
        <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
        <div className="h-11 w-28 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
      </Container>

      <Container
        width="wide"
        className="grid grid-cols-1 gap-12 py-10 sm:py-12 lg:grid-cols-12 lg:gap-14 lg:py-16"
      >
        {/* Gallery */}
        <div className="lg:col-span-6 xl:col-span-7">
          <div className="aspect-[4/5] w-full animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-surface-muted)]" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="h-7 w-32 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
          </div>
        </div>

        {/* Dossier */}
        <aside className="lg:col-span-6 xl:col-span-5">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <div className="h-3 w-16 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
              <div className="h-12 w-3/4 animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton.
                    key={idx}
                    className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-surface-muted)]"
                  />
                ))}
              </div>
            </div>

            <div className="h-20 w-full animate-pulse rounded-md bg-[var(--color-surface-muted)]" />

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton.
                  key={idx}
                  className="h-16 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
                />
              ))}
            </div>

            <div className="h-40 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]" />
          </div>
        </aside>
      </Container>
      <span className="sr-only">Cargando perfil…</span>
    </main>
  );
}
