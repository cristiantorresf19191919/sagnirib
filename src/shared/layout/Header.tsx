import Link from "next/link";
import { ArrowUpRight, Clock, HelpCircle, Plus } from "lucide-react";

import { localizedHref } from "@/core/i18n/href";
import { LocaleSwitcher } from "@/core/i18n/LocaleSwitcher";
import { readLocale } from "@/core/i18n/locale";
import { t } from "@/core/i18n/messages";
import { Container } from "@/shared/design-system/components/Container";
import { Logo } from "@/shared/design-system/components/Logo";
import { AuthBadge } from "@/features/auth/components/AuthBadge";
import { readAccountTypeCookie } from "@/features/auth/lib/account-type-cookie";
import { FavoritesNavLink } from "@/features/favorites/components/FavoritesNavLink";
import { PanicButton } from "@/features/safety/components/PanicButton";
import { getSession } from "@/server/auth";
import { listMyDrafts } from "@/server/biringas";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  getMyAccountType,
  type AccountType,
} from "@/server/users";

import { HeaderBackdrop } from "./HeaderBackdrop";
import { MobileNav } from "./MobileNav";
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
 *   LOGO  |  DISCOVERY              |  ACCOUNT   |  UTIL  |  CTAs              |  AVATAR
 *         |  Cómo funciona · Faves  |  Ingresar  |  Theme |  Publica · Explorar |  ▾ menú
 *
 * The ACCOUNT slot only shows "Ingresar" for anonymous visitors. Once signed
 * in, the account UI becomes the avatar dropdown pinned to the far-right edge
 * (after the CTAs) so the user's identity + menu is the last thing on the bar.
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
interface CtaState {
  accountType: AccountType | null;
  /**
   * Id of the signed-in publisher's listing currently in human review, if
   * any. Drives the pending-aware CTA swap (publish → "Perfil en revisión").
   */
  pendingDraftId: string | null;
}

/**
 * Resolves the seller-side CTA state in one pass:
 *
 *   - Authenticated → `users/{uid}.accountType` is the authority (a stale
 *     cookie cannot mis-render the CTA), and for publishers we also read
 *     their drafts to surface an in-review listing as a status chip.
 *   - Anonymous → fall back to the `biringas:account-type` cookie which
 *     captures a pre-auth chooser pick. Hiding the publish CTA for a
 *     self-declared cliente, even before login, matches the funnel UX.
 *     Defaults to "show" (accountType null) if the cookie is absent.
 *
 * Commentators can't publish, so the (extra) draft read is skipped for them
 * and for anonymous visitors.
 */
async function resolveCtaState(): Promise<CtaState> {
  const session = await getSession().catch(() => null);
  if (!session) {
    return { accountType: await readAccountTypeCookie(), pendingDraftId: null };
  }
  // Run the two Firestore reads concurrently instead of serially — they're
  // independent, so this halves the round-trip latency the Header adds to
  // every navigation. (Commentators do one extra read they don't strictly
  // need, but they're the minority and the common publisher path wins.)
  const [accountType, drafts] = await Promise.all([
    getMyAccountType().catch(() => null),
    listMyDrafts().catch(() => []),
  ]);
  if (accountType === ACCOUNT_TYPE_COMMENTATOR) {
    return { accountType, pendingDraftId: null };
  }
  const pendingDraftId =
    drafts.find((d) => d.status === "pending_review")?.id ?? null;
  return { accountType, pendingDraftId };
}

export async function Header({ hideCatalogCta = false }: HeaderProps) {
  // Locale is resolved server-side so the strings render correctly on
  // first paint without a client-side language flicker.
  const locale = await readLocale();
  const howLabel = t(locale, "header.nav.how");
  const publishLabel = t(locale, "header.cta.publish");
  const exploreLabel = t(locale, "header.cta.explore");

  // ADR-019: commentator-locked accounts cannot publish, so the CTA is
  // hidden. The DB doc `users/{uid}.accountType` is the authority
  // (`getMyAccountType`); the cookie remains a hint for anonymous
  // visitors who already picked but haven't authenticated yet. Hiding
  // the CTA is UX — the mutation gate inside `createListingDraft`
  // (`requirePublisher`) remains the actual security boundary.
  const { accountType, pendingDraftId } = await resolveCtaState();
  const hidePublishCta = accountType === ACCOUNT_TYPE_COMMENTATOR;
  const reviewHref = pendingDraftId
    ? localizedHref(locale, `/mi-cuenta/borradores/${pendingDraftId}`)
    : null;

  return (
    <header data-testid="header" className="sticky top-0 z-30 isolate">
      <HeaderBackdrop />

      <Container
        width="wide"
        className="flex h-16 items-center justify-between gap-3 lg:gap-4"
      >
        <Logo size="md" />

        {/* Mobile (< lg): subtle quick-exit + hamburger → full-screen drawer. */}
        <div className="flex items-center gap-0.5 lg:hidden">
          <PanicButton />
          <MobileNav
            locale={locale}
            hidePublishCta={hidePublishCta}
            hideCatalogCta={hideCatalogCta}
            reviewHref={reviewHref}
          />
        </div>

        <nav
          data-testid="header-nav"
          aria-label={t(locale, "header.aria.mainNav")}
          className="hidden min-w-0 items-center gap-0.5 lg:flex lg:gap-1"
        >
          {/* 1. DISCOVERY — How (learn) + Favorites (engage with what
              already resonated). Both collapse labels on mobile. */}
          <Link
            data-testid="header-link-how-it-works"
            href={`${localizedHref(locale, "/")}#como-funciona`}
            aria-label={howLabel}
            className="group/nav inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 lg:px-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-standard)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <HelpCircle
              className="h-4 w-4 lg:hidden"
              aria-hidden
            />
            <span className="relative hidden whitespace-nowrap lg:inline-block">
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
            className="mx-1.5 hidden h-6 w-px bg-[var(--color-border)] lg:block"
          />

          {/* 2. ACCOUNT (anonymous) — surface sign-in right where the user
              reaches for it (immediately before they want to publish or
              explore). When signed-in the avatar moves to the far right
              (rendered after the CTAs); this slot renders nothing then. */}
          <AuthBadge placement="signin-slot" />

          {/* 3. UTILITY — theme toggle + locale switcher. Lowest priority;
              sit flush with the CTAs so they don't draw eyes away from
              discovery. */}
          <ThemeToggle />
          <LocaleSwitcher current={locale} />
          {/* Discreet quick-exit — paints a neutral news site over everything
              (no header, no Biringas) to shield the screen from onlookers.
              Restored with Escape or by clicking the news masthead. */}
          <PanicButton />

          {/* 4. SECONDARY CTA — seller-side ask. Outline pill so it reads
              as the supporting action against the primary explore CTA.
              Hidden for commentator-account users — that role cannot
              publish (PDF page 6 RBAC matrix).

              When the publisher already has a listing in human review, the
              ask is done: the slot becomes an amber status chip linking to
              the in-review listing instead of inviting another publish. */}
          {reviewHref ? (
            <Link
              data-testid="header-link-profile-in-review"
              href={reviewHref}
              aria-label={t(locale, "header.cta.profileInReview")}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 px-3 lg:px-4 text-sm font-semibold text-[var(--color-brand-accent-strong)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-accent)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              <Clock className="h-4 w-4" aria-hidden />
              <span className="hidden whitespace-nowrap lg:inline">
                {t(locale, "header.cta.profileInReview")}
              </span>
            </Link>
          ) : !hidePublishCta ? (
            <Link
              data-testid="header-link-publish-profile"
              href={localizedHref(locale, "/publicar")}
              aria-label={publishLabel}
              className="group/publish relative inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 lg:px-4 text-sm font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {/* Plus rotates 90° on hover → reads as "open / create". */}
              <Plus
                className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-standard)] group-hover/publish:rotate-90 lg:hidden"
                aria-hidden
              />
              <span className="hidden whitespace-nowrap lg:inline">{publishLabel}</span>
            </Link>
          ) : null}

          {/* 5. PRIMARY CTA — buyer-side conversion. Filled forest pill,
              rightmost so it's the last and strongest action on the bar.
              Hidden on the catalog page itself so we never show two
              competing explore affordances. */}
          {!hideCatalogCta && (
            <Link
              data-testid="header-cta-explore"
              href={localizedHref(locale, "/explorar")}
              className="group relative inline-flex h-11 items-center gap-1.5 overflow-hidden rounded-full bg-[var(--color-brand-primary)] px-4 lg:px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:bg-[var(--color-brand-primary-strong)] hover:shadow-[0_18px_36px_-12px_rgba(47,93,67,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
            >
              {/* Shimmer sweep on hover — same vocabulary as the hero search */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 block w-1/3 bg-gradient-to-r from-transparent via-[rgba(200,166,118,0.55)] to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:motion-shimmer-sweep"
              />
              <span className="relative whitespace-nowrap">{exploreLabel}</span>
              <ArrowUpRight
                className="relative h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:-translate-y-px group-hover:translate-x-px"
                aria-hidden
              />
            </Link>
          )}

          {/* 6. ACCOUNT (authenticated) — avatar at the far right edge.
              Clicking it opens the account dropdown (Dashboard + sign-out).
              Renders nothing when anonymous; the sign-in slot above handles
              that case. */}
          <AuthBadge
            placement="account-menu"
            isCommentator={accountType === ACCOUNT_TYPE_COMMENTATOR}
          />
        </nav>
      </Container>
    </header>
  );
}
