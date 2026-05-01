import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";
import { FavoritesNavLink } from "@/features/favorites/components/FavoritesNavLink";

import { HeaderBackdrop } from "./HeaderBackdrop";

interface HeaderProps {
  /**
   * Hide the header CTA when the page itself is the catalog target — keeps
   * a single primary CTA visible per surface.
   */
  hideCatalogCta?: boolean;
}

export function Header({ hideCatalogCta = false }: HeaderProps) {
  return (
    <header data-testid="header" className="sticky top-0 z-30 isolate">
      <HeaderBackdrop />

      <Container
        width="wide"
        className="flex h-16 items-center justify-between gap-4"
      >
        <Logo size="md" />

        <nav
          data-testid="header-nav"
          aria-label="Navegación principal"
          className="flex items-center gap-1"
        >
          <Link
            data-testid="header-link-how-it-works"
            href="/#como-funciona"
            className="hidden sm:inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Cómo funciona
          </Link>

          <FavoritesNavLink />

          <Link
            data-testid="header-link-publish-profile"
            href="/publicar"
            className="hidden sm:inline-flex h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Publica tu perfil
          </Link>

          {!hideCatalogCta && (
            <Link
              data-testid="header-cta-explore"
              href="/explorar"
              className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              Explorar
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-px group-hover:translate-x-px"
                aria-hidden
              />
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
