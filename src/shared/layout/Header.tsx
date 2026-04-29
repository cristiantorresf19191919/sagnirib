import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";

interface HeaderProps {
  /**
   * Hide the header CTA when the page itself is the catalog target — keeps
   * a single primary CTA visible per surface.
   */
  hideCatalogCta?: boolean;
}

export function Header({ hideCatalogCta = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 border-b border-[var(--color-border)]/50 bg-[var(--color-background)]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-background)]/55"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px -z-10 bg-gradient-to-r from-transparent via-[var(--color-brand-primary)]/60 to-transparent"
      />

      <Container
        width="wide"
        className="flex h-16 items-center justify-between gap-4"
      >
        <Logo size="md" />

        <nav
          aria-label="Navegación principal"
          className="flex items-center gap-1"
        >
          <Link
            href="/#como-funciona"
            className="hidden sm:inline-flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Cómo funciona
          </Link>

          {!hideCatalogCta && (
            <Link
              href="/explorar"
              className="group inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3.5 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary)]/60 hover:bg-[var(--color-surface)] hover:shadow-[0_8px_24px_-8px_rgba(255,43,181,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Explorar
              <ArrowUpRight
                className="h-3.5 w-3.5 text-[var(--color-brand-primary-strong)] transition-transform duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-px group-hover:translate-x-px"
                aria-hidden
              />
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
