"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Header slot that switches on auth state:
 *
 *   - loading       → empty (avoid layout shift; rendered after hydration)
 *   - disabled      → empty (Firebase Web SDK env vars missing)
 *   - anonymous     → "Sign in" link → /ingresar
 *   - authenticated → user chip linking to /mi-cuenta + sign-out icon
 *
 * Reads locale from `useLocale()` context — same pattern as the rest
 * of the client tree, no prop drilling needed.
 */
export function AuthBadge() {
  const locale = useLocale();
  const router = useRouter();
  const { status, user, signOut } = useAuthSession();

  if (status === "loading" || status === "disabled") {
    return null;
  }

  if (status === "anonymous") {
    return (
      <Link
        href="/ingresar"
        className="group inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        aria-label={t(locale, "header.signIn.aria")}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t(locale, "header.signIn")}</span>
      </Link>
    );
  }

  // authenticated — derive a label, falling back to the localized
  // "Mi cuenta" copy if no displayName / email-local-part is available.
  const label =
    user?.displayName ??
    user?.email?.split("@")[0] ??
    t(locale, "header.myAccount");

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
      <Link
        href="/mi-cuenta"
        title={user?.email ?? undefined}
        aria-label={t(locale, "header.myAccount.aria")}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 sm:px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <UserIcon className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline max-w-[140px] truncate">
          {label}
        </span>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        aria-label={t(locale, "header.signOut.aria")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <LogOut className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
