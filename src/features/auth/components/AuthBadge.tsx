"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

import { useAuthSession } from "../lib/use-auth-session";

/**
 * Header slot that switches on auth state:
 *
 *   - loading       → empty (avoid layout shift; rendered after hydration)
 *   - disabled      → empty (Firebase Web SDK env vars missing)
 *   - anonymous     → "Ingresar" link → /ingresar
 *   - authenticated → user chip + sign-out icon button
 *
 * Copy is BRAND_HANDSHAKE_TODO. Visual treatment matches the existing
 * neutral nav links in the header.
 */
export function AuthBadge() {
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
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {/* BRAND_HANDSHAKE_TODO: signed-out CTA */}
        <span className="hidden sm:inline">Ingresar</span>
      </Link>
    );
  }

  // authenticated
  const label =
    user?.displayName ??
    user?.email?.split("@")[0] ??
    /* BRAND_HANDSHAKE_TODO: fallback when no email/displayName */
    "Mi cuenta";

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
      <span
        className="hidden sm:inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-foreground)]"
        title={user?.email ?? undefined}
      >
        <UserIcon className="h-4 w-4" aria-hidden />
        <span className="max-w-[140px] truncate">{label}</span>
      </span>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Cerrar sesión"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <LogOut className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
