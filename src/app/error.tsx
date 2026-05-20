"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/shared/design-system/components/Container";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary. Lives below the root layout, so Header and
 * Footer remain mounted — only the route segment is replaced. The `digest`
 * Next attaches to server-thrown errors is surfaced so support can correlate
 * a user-reported incident with logs.
 */
export default function RouteError({ error, reset }: Readonly<ErrorProps>) {
  useEffect(() => {
    console.error("[app] route boundary caught:", error);
  }, [error]);

  return (
    <main className="relative isolate flex flex-1 items-center bg-[var(--color-background)] py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(199,76,76,0.06),transparent_60%)]"
      />
      <Container width="narrow">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">
            <span
              aria-hidden
              className="inline-block h-px w-8 bg-gradient-to-r from-[var(--color-gold)] to-transparent"
            />
            Algo no salió bien
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            Hubo un tropiezo al cargar esta página.
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Es del lado nuestro, no tuyo. Probá de nuevo en un momento — si
            vuelve a pasar, escribinos y lo revisamos.
          </p>
          {error.digest ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Ref: {error.digest}
            </p>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Intentar de nuevo
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-brand-primary)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
