import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";
import { AuthBadge } from "@/features/auth/components/AuthBadge";
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
            className="group/nav hidden sm:inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <span className="relative inline-block">
              Cómo funciona
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-[3px] left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-transparent transition-transform duration-300 ease-[var(--ease-standard)] group-hover/nav:scale-x-100"
              />
            </span>
          </Link>

          <FavoritesNavLink />

          <AuthBadge />

          <Link
            data-testid="header-link-publish-profile"
            href="/publicar"
            aria-label="Publica tu perfil"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <Plus className="h-4 w-4 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Publica tu perfil</span>
          </Link>

          {!hideCatalogCta && (
            <Link
              data-testid="header-cta-explore"
              href="/explorar"
              className="group relative inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] hover:shadow-[0_18px_36px_-12px_rgba(47,93,67,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {/* Shimmer sweep on hover — same vocabulary as the hero search */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:motion-shimmer-sweep"
              />
              <span className="relative">Explorar</span>
              <ArrowUpRight
                className="relative h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-px group-hover:translate-x-px"
                aria-hidden
              />
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
