"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";

import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";

import { useAuthSession } from "../lib/use-auth-session";

interface AuthBadgeProps {
  /**
   * Which auth state this instance is responsible for rendering — lets the
   * header place each state in its own slot:
   *
   *   - "signin-slot"  → renders the anonymous "Sign in" link, sits before
   *     the CTAs (where a visitor reaches for it). Null when authenticated.
   *   - "account-menu" → renders the authenticated avatar + dropdown, sits
   *     at the far right of the header. Null when anonymous.
   *
   * Both are mounted; only one ever renders because they key off opposite
   * auth states.
   */
  placement: "signin-slot" | "account-menu";
  /**
   * True when the signed-in account is a commentator (ADR-019). Commentators
   * can't publish and never pay, so the Settings/Billing menu items — both
   * publisher-only surfaces that bounce them away — are hidden. Resolved
   * server-side in the Header from `users/{uid}.accountType`, NOT the role
   * claim. Irrelevant for the anonymous signin-slot, which renders no menu.
   */
  isCommentator?: boolean;
}

/**
 * Header slot that switches on auth state:
 *
 *   - loading       → empty (avoid layout shift; rendered after hydration)
 *   - disabled      → empty (Firebase Web SDK env vars missing)
 *   - anonymous     → "Sign in" link → /ingresar         (placement="signin-slot")
 *   - authenticated → avatar button + account dropdown    (placement="account-menu")
 *
 * The authenticated avatar lives at the far right of the header and shows
 * only the user's first name. Clicking it opens the account menu — Dashboard
 * (→ /mi-cuenta), Settings, Billing and sign-out. All user-account actions
 * live here; nothing account-related is left loose in the bar. Settings and
 * Billing routes are placeholders until their pages ship.
 *
 * Visual treatment matches the existing neutral nav links in the header.
 */
export function AuthBadge({ placement, isCommentator = false }: AuthBadgeProps) {
  const router = useRouter();
  const locale = useActiveLocale();
  const ingresarHref = useLocalizedHref("/ingresar");
  const miCuentaHref = useLocalizedHref("/mi-cuenta");
  const settingsHref = useLocalizedHref("/mi-cuenta/configuracion");
  const billingHref = useLocalizedHref("/mi-cuenta/facturacion");
  const { status, user, signOut } = useAuthSession();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click + Escape so the menu behaves like a native popover.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (status === "disabled") {
    return null;
  }

  // While the Firebase session resolves we don't yet know if the visitor is
  // anonymous or signed in. Returning null here is what made the account
  // avatar/name "pop in" with a jump once auth landed. Instead the far-right
  // account slot holds a calm shimmering skeleton sized exactly like the real
  // avatar pill, so the layout is reserved and the resolved state fades in
  // place. The sign-in slot stays empty during loading (it only ever shows for
  // confirmed-anonymous visitors, where a brief delay reads fine).
  if (status === "loading") {
    if (placement !== "account-menu") {
      return null;
    }
    return <AccountSkeleton />;
  }

  if (status === "anonymous") {
    if (placement !== "signin-slot") {
      return null;
    }
    return (
      <Link
        href={ingresarHref}
        className="group inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span className="hidden whitespace-nowrap lg:inline">{t(locale, "header.signIn")}</span>
      </Link>
    );
  }

  // authenticated — only the far-right account-menu slot renders the avatar.
  if (placement !== "account-menu") {
    return null;
  }

  // Show only the first name — "Cristian Torres" → "Cristian". For
  // email-derived names there's no space, so the whole local part is used.
  const fullName =
    user?.displayName ??
    user?.email?.split("@")[0] ??
    t(locale, "auth.badge.fallbackName");
  const label = fullName.trim().split(/\s+/)[0];

  async function onSignOut() {
    close();
    try {
      await signOut();
      router.refresh();
    } catch (err) {
      console.error("[auth] signOut failed", err);
    }
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative inline-flex"
      // Fade + settle in once the session resolves so it replaces the
      // skeleton in place instead of snapping (the reported "name jump").
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Avatar trigger — far-right entry point to the account menu. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={user?.email ?? undefined}
        aria-label={t(locale, "auth.badge.openAccount")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 lg:px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-primary-soft)] text-[var(--color-brand-primary)]">
          <UserIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden max-w-[140px] truncate lg:inline">{label}</span>
        <ChevronDown
          className={`hidden h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 ease-[var(--ease-standard)] lg:inline ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t(locale, "auth.badge.openAccount")}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-[200px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-md)]"
        >
          <Link
            href={miCuentaHref}
            role="menuitem"
            onClick={close}
            className="flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-inset"
          >
            <LayoutDashboard className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
            {t(locale, "auth.badge.menu.dashboard")}
          </Link>

          {/* Settings + Billing are publisher-only surfaces (ADR-019); both
              redirect commentators to their own dashboard, so hide the menu
              entries for them rather than offering a link that bounces. */}
          {!isCommentator ? (
            <>
              <Link
                href={settingsHref}
                role="menuitem"
                onClick={close}
                className="flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-inset"
              >
                <SettingsIcon className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
                {t(locale, "auth.badge.menu.settings")}
              </Link>

              <Link
                href={billingHref}
                role="menuitem"
                onClick={close}
                className="flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-inset"
              >
                <CreditCard className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
                {t(locale, "auth.badge.menu.billing")}
              </Link>
            </>
          ) : null}

          <span aria-hidden className="my-1 block h-px bg-[var(--color-border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-inset"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t(locale, "auth.badge.signOut")}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Placeholder for the account avatar while the auth session resolves. Matches
 * the real pill's geometry (h-11, 7×7 avatar, name bar on lg) so swapping it
 * for the resolved avatar causes zero layout shift. A slow sheen sweeps across
 * it as a "loading" cue; it calms under reduced motion via framer-motion's
 * global MotionConfig.
 */
function AccountSkeleton() {
  return (
    <div
      aria-hidden
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 lg:px-3"
    >
      <span className="relative inline-flex h-7 w-7 overflow-hidden rounded-full bg-[var(--color-background-elevated)]">
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-surface)] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
        />
      </span>
      <span className="relative hidden h-3 w-16 overflow-hidden rounded-full bg-[var(--color-background-elevated)] lg:inline-block">
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-surface)] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
        />
      </span>
    </div>
  );
}
