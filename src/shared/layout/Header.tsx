import Link from "next/link";
import { ArrowUpRight, HelpCircle, Plus } from "lucide-react";

import { LocaleSwitcher } from "@/core/i18n/LocaleSwitcher";
import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";
import { AuthBadge } from "@/features/auth/components/AuthBadge";
import { FavoritesNavLink } from "@/features/favorites/components/FavoritesNavLink";

import { HeaderBackdrop } from "./HeaderBackdrop";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  /**
   * Hide the header CTA when the page itself is the catalog target — keeps
   * a single primary CTA visible per surface.
   */
  hideCatalogCta?: boolean;
}

/**
 * Site-wide sticky header — marketing-driven layout.
 *
 * Reading the bar left → right tells the buyer journey:
 *
 *   LOGO  |  DISCOVERY              |  ACCOUNT       |  UTIL  |  CTAs
 *         |  Cómo funciona · Faves  |  Ingresar      |  Theme |  Publica · Explorar
 *
 * Why this order:
 *   1. Logo anchors brand identity at the left edge.
 *   2. Discovery cluster (low-commitment: learn → engage with what you
 *      already like) — appears first because it converts curious visitors
 *      into qualified prospects.
 *   3. Account state — appears once the user has discovered enough to
 *      need an account (favoritas requires saving; reservations require
 *      login). Putting it BEFORE the CTAs avoids the "click → bounce →
 *      where do I sign in?" loop.
 *   4. Theme toggle — pure utility, ranked deliberately low. Lives just
 *      before the CTAs so it doesn't dilute the discovery cluster.
 *   5. Secondary CTA — `Publica tu perfil` (the SELLER-side ask). Outline
 *      treatment so it doesn't compete with the primary buyer CTA.
 *   6. Primary CTA — `Explorar`. Filled forest pill, rightmost so it's the
 *      last and strongest action on the bar (Fitt's-law sweet spot near
 *      the typical reading-exit point).
 *
 * Mobile (< sm) collapses labels to icons but preserves the order; touch
 * targets stay 44×44 px throughout.
 */
export async function Header({ hideCatalogCta = false }: HeaderProps) {
  // Locale is resolved server-side so the strings render correctly on
  // first paint without a client-side language flicker.
  const locale = await readLocale();
  const howLabel = t(locale, "header.nav.how");
  const publishLabel = t(locale, "header.cta.publish");
  const exploreLabel = t(locale, "header.cta.explore");

  return (
    <header data-testid="header" className="sticky top-0 z-30 isolate">
      <HeaderBackdrop />

      <Container
        width="wide"
        className="flex h-16 items-center justify-between gap-3 sm:gap-4"
      >
        <Logo size="md" />

        <nav
          data-testid="header-nav"
          aria-label="Navegación principal"
          className="flex items-center gap-0.5 sm:gap-1"
        >
          {/* 1. DISCOVERY — How (learn) + Favorites (engage with what
              already resonated). Both collapse labels on mobile. */}
          <Link
            data-testid="header-link-how-it-works"
            href="/#como-funciona"
            aria-label={howLabel}
            className="group/nav inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 sm:px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-standard)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <HelpCircle
              className="h-4 w-4 sm:hidden"
              aria-hidden
            />
            <span className="relative hidden sm:inline-block">
              {howLabel}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-[3px] left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-gold)] to-transparent transition-transform duration-300 ease-[var(--ease-standard)] group-hover/nav:scale-x-100"
              />
            </span>
          </Link>

          <FavoritesNavLink />

          {/* Divider: separates the DISCOVERY cluster (left) from the
              ACCOUNT + UTILITY + CTA cluster (right). */}
          <span
            aria-hidden
            className="mx-1.5 hidden h-6 w-px bg-[var(--color-border)] sm:block"
          />

          {/* 2. ACCOUNT — surface sign-in right where the user reaches
              for it (immediately before they want to publish or explore).
              When signed-in this slot renders the user chip + sign-out. */}
          <AuthBadge />

          {/* 3. UTILITY — theme toggle + locale switcher. Lowest priority;
              sit flush with the CTAs so they don't draw eyes away from
              discovery. */}
          <ThemeToggle />
          <LocaleSwitcher current={locale} />

          {/* 4. SECONDARY CTA — seller-side ask. Outline pill so it reads
              as the supporting action against the primary explore CTA. */}
          <Link
            data-testid="header-link-publish-profile"
            href="/publicar"
            aria-label={publishLabel}
            className="group/publish relative inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            {/* Plus rotates 90° on hover → reads as "open / create". */}
            <Plus
              className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-standard)] group-hover/publish:rotate-90 sm:hidden"
              aria-hidden
            />
            <span className="hidden sm:inline">{publishLabel}</span>
          </Link>

          {/* 5. PRIMARY CTA — buyer-side conversion. Filled forest pill,
              rightmost so it's the last and strongest action on the bar.
              Hidden on the catalog page itself so we never show two
              competing explore affordances. */}
          {!hideCatalogCta && (
            <Link
              data-testid="header-cta-explore"
              href="/explorar"
              className="group relative inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full bg-[var(--color-brand-primary)] px-4 sm:px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] hover:shadow-[0_18px_36px_-12px_rgba(47,93,67,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {/* Shimmer sweep on hover — same vocabulary as the hero search */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:motion-shimmer-sweep"
              />
              <span className="relative">{exploreLabel}</span>
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
