import { Container } from "@/shared/design-system/components/Container";

/**
 * Route-level skeleton for `/publicar`. Mirrors the wizard's header +
 * step-indicator strip + a tall card placeholder for the current step.
 */
export default function Loading() {
  return (
    <main
      className="bg-[var(--color-background)] pb-20 pt-8 sm:pt-10"
      data-testid="publicar-loading"
    >
      <Container width="wide" className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
          <div className="h-12 w-3/4 max-w-xl animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-1/2 max-w-md animate-pulse rounded bg-[var(--color-surface-muted)]" />
        </header>

        {/* Step indicator strip */}
        <div className="flex items-center gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton.
              key={idx}
              className="h-10 flex-1 animate-pulse rounded-full bg-[var(--color-surface-muted)]"
            />
          ))}
        </div>

        {/* Card placeholder */}
        <div className="h-[420px] animate-pulse rounded-[var(--radius-2xl)] bg-[var(--color-surface-muted)]" />
      </Container>
      <span className="sr-only">Cargando publicación…</span>
    </main>
  );
}
