import { Container } from "@/shared/design-system/components/Container";
import { LoadingTips } from "@/shared/layout/LoadingTips";

const SKELETON_CARDS = Array.from({ length: 8 });

/**
 * Route-level skeleton for `/`. Matches the catalog grid shape so the page
 * never collapses to a single spinner while filters re-fetch — the user
 * keeps a sense of place during navigation.
 *
 * Pulse animation lives in CSS (`animate-pulse`) so SSR ships it without
 * needing JS to start. Reduced-motion browsers will see a static surface,
 * which is fine — the skeleton's purpose is shape, not motion.
 */
export default function Loading() {
  return (
    <main className="flex flex-col" data-testid="catalog-loading">
      <section className="relative pb-12 pt-24 sm:pt-32">
        <Container width="wide">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="h-8 w-2/3 max-w-md animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
          </div>

          {/* Rotating tips strip — replaces the dead vertical space between
              the page title and the skeleton grid with safety, trust, and
              growth nudges. */}
          <div className="mt-6">
            <LoadingTips />
          </div>
          <ul
            aria-hidden
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {SKELETON_CARDS.map((_, idx) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are stable.
                key={idx}
                className="flex animate-pulse flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3"
              >
                <div className="aspect-[4/5] w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]" />
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-3 w-8 rounded bg-[var(--color-surface-muted)]" />
                </div>
                <div className="h-3 w-3/4 rounded bg-[var(--color-surface-muted)]" />
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="h-3 w-20 rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-5 w-24 rounded bg-[var(--color-surface-muted)]" />
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <span className="sr-only">Cargando catálogo…</span>
    </main>
  );
}
