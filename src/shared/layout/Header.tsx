import Link from "next/link";

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
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)]/50 bg-[var(--color-background)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/70">
      <Container
        width="wide"
        className="flex h-16 items-center justify-between gap-4"
      >
        <Logo size="md" />
        <nav aria-label="Navegación principal" className="flex items-center gap-1">
          {!hideCatalogCta && (
            <Link
              href="/explorar"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Explorar
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
