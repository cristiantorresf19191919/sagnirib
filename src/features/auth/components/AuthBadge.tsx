"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Header slot that switches on auth state:
 *
 *   - loading       → empty (avoid layout shift; rendered after hydration)
 *   - disabled      → empty (Firebase Web SDK env vars missing)
 *   - anonymous     → "Sign in" link → /ingresar
 *   - authenticated → user chip + sign-out icon button
 *
 * Visual treatment matches the existing neutral nav links in the header.
 */
export function AuthBadge() {
  const router = useRouter();
  const locale = useActiveLocale();
  const ingresarHref = useLocalizedHref("/ingresar");
  const miCuentaHref = useLocalizedHref("/mi-cuenta");
  const { status, user, signOut } = useAuthSession();

  if (status === "loading" || status === "disabled") {
    return null;
  }

  if (status === "anonymous") {
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

  // authenticated
  const label =
    user?.displayName ??
    user?.email?.split("@")[0] ??
    t(locale, "auth.badge.fallbackName");

  async function onSignOut() {
    try {
      await signOut();
      router.refresh();
    } catch (err) {
      console.error("[auth] signOut failed", err);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      {/* Authed user chip links to the dashboard — clicking the name is
          the most natural way to reach "Mi cuenta". On mobile the label
          collapses but the icon stays as a smaller round entry point. */}
      <Link
        href={miCuentaHref}
        title={user?.email ?? undefined}
        aria-label={t(locale, "auth.badge.openAccount")}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 lg:px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <UserIcon className="h-4 w-4" aria-hidden />
        <span className="hidden lg:inline max-w-[140px] truncate">
          {label}
        </span>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        aria-label={t(locale, "auth.badge.signOut")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <LogOut className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
