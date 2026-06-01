"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clock,
  Compass,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Plus,
  User,
} from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { LocaleSwitcher } from "@/core/i18n/LocaleSwitcher";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";

import { MobileMenu, type MobileCta, type MobileNavItem } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

interface MobileNavProps {
  locale: SupportedLocale;
  hidePublishCta?: boolean;
  hideCatalogCta?: boolean;
  /**
   * When set, the publisher has a listing in human review: the publish
   * affordance becomes a "Perfil en revisión" link to this href instead.
   */
  reviewHref?: string | null;
  className?: string;
}

/**
 * Mobile-only navigation: a hamburger that morphs to an X and opens the
 * full-screen animated drawer (`MobileMenu`). Rendered inside the Biringas
 * header below the `lg` breakpoint; the desktop nav handles `lg+`.
 *
 * Account rows switch on the live auth session, and the drawer footer reuses
 * the real `ThemeToggle` + `LocaleSwitcher` so the 7-mood theming and locale
 * switch behave identically to the desktop header.
 */
export function MobileNav({
  locale,
  hidePublishCta = false,
  hideCatalogCta = false,
  reviewHref = null,
  className = "",
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { status, signOut } = useAuthSession();
  const authed = status === "authenticated";

  async function onSignOut() {
    try {
      await signOut();
      router.refresh();
    } catch (err) {
      console.error("[mobile-nav] signOut failed", err);
    }
  }

  const items: MobileNavItem[] = [
    {
      id: "how",
      label: t(locale, "header.nav.how"),
      icon: <HelpCircle className="h-[18px] w-[18px]" aria-hidden />,
      href: `${localizedHref(locale, "/")}#como-funciona`,
    },
    {
      id: "favorites",
      label: t(locale, "header.nav.favorites"),
      icon: <Heart className="h-[18px] w-[18px]" aria-hidden />,
      href: localizedHref(locale, "/favoritas"),
    },
    {
      id: "explore",
      label: t(locale, "header.cta.explore"),
      icon: <Compass className="h-[18px] w-[18px]" aria-hidden />,
      href: localizedHref(locale, "/explorar"),
    },
    ...(reviewHref
      ? [
          {
            id: "profile-in-review",
            label: t(locale, "header.cta.profileInReview"),
            icon: <Clock className="h-[18px] w-[18px]" aria-hidden />,
            href: reviewHref,
          } satisfies MobileNavItem,
        ]
      : hidePublishCta
        ? []
        : [
            {
              id: "publish",
              label: t(locale, "header.cta.publish"),
              icon: <Plus className="h-[18px] w-[18px]" aria-hidden />,
              href: localizedHref(locale, "/publicar"),
            } satisfies MobileNavItem,
          ]),
    authed
      ? {
          id: "account",
          label: t(locale, "auth.badge.menu.dashboard"),
          icon: <User className="h-[18px] w-[18px]" aria-hidden />,
          href: localizedHref(locale, "/mi-cuenta"),
        }
      : {
          id: "signin",
          label: t(locale, "header.signIn"),
          icon: <LogIn className="h-[18px] w-[18px]" aria-hidden />,
          href: localizedHref(locale, "/ingresar"),
        },
    ...(authed
      ? [
          {
            id: "signout",
            label: t(locale, "auth.badge.signOut"),
            icon: <LogOut className="h-[18px] w-[18px]" aria-hidden />,
            onClick: onSignOut,
          } satisfies MobileNavItem,
        ]
      : []),
  ];

  const cta: MobileCta | undefined = reviewHref
    ? {
        label: t(locale, "header.cta.profileInReview"),
        icon: <Clock className="h-4 w-4" aria-hidden />,
        href: reviewHref,
      }
    : !hidePublishCta
      ? {
          label: t(locale, "header.cta.publish"),
          icon: <Plus className="h-4 w-4" aria-hidden />,
          href: localizedHref(locale, "/publicar"),
        }
      : !hideCatalogCta
        ? {
            label: t(locale, "header.cta.explore"),
            icon: <ArrowUpRight className="h-4 w-4" aria-hidden />,
            href: localizedHref(locale, "/explorar"),
          }
        : undefined;

  const openLabel = locale === "en" ? "Open menu" : "Abrir menú";
  const closeLabel = locale === "en" ? "Close menu" : "Cerrar menú";

  return (
    <div className={className}>
      <button
        type="button"
        className={`amh-toggle ${open ? "amh-toggle--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
      >
        <span className="amh-hamburgerLine" />
        <span className="amh-hamburgerLine" />
        <span className="amh-hamburgerLine" />
      </button>

      <MobileMenu
        isOpen={open}
        onClose={() => setOpen(false)}
        brand="Biringas"
        items={items}
        cta={cta}
        footerBrand="Biringas"
        closeLabel={closeLabel}
        footerControls={
          <>
            <ThemeToggle />
            <LocaleSwitcher current={locale} />
          </>
        }
      />
    </div>
  );
}
