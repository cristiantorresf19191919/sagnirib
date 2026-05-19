import { Container } from "@/shared/design-system/components/Container";

const SKELETON_CARDS = Array.from({ length: 4 });

/**
 * Route-level skeleton for `/favoritas`. Header + favorite-card grid stub
 * so the page never collapses to a spinner while the client hydrates the
 * persistent favorites store from localStorage.
 */
export default function Loading() {
  return (
    <main
      className="relative isolate flex flex-1 flex-col"
      data-testid="favorites-loading"
    >
      <Container width="wide" className="py-12 sm:py-16">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
          <div className="h-12 w-3/4 max-w-md animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-1/2 max-w-sm animate-pulse rounded bg-[var(--color-surface-muted)]" />
        </div>
        <ul
          aria-hidden
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {SKELETON_CARDS.map((_, idx) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton.
              key={idx}
              className="flex animate-pulse flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3"
            >
              <div className="aspect-[4/5] w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-surface-muted)]" />
            </li>
          ))}
        </ul>
      </Container>
      <span className="sr-only">Cargando favoritas…</span>
    </main>
  );
}
