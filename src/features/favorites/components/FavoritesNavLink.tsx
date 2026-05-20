"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";

import { useFavorites } from "../store/use-favorites";

/**
 * Header link to /favoritas with a live count badge sourced from the
 * favorites store. Renders nothing-special when the count is 0 — the icon
 * is enough; the badge appears only when the user has saved something.
 *
 * Reads locale from `useLocale()` context so the Header doesn't have to
 * prop-drill — the LocaleProvider in `app/providers.tsx` makes it
 * available everywhere in the client tree.
 */
export function FavoritesNavLink() {
  const locale = useLocale();
  const { favorites, ready } = useFavorites();
  const count = ready ? favorites.length : 0;
  const hasItems = count > 0;

  return (
    <Link
      href="/favoritas"
      aria-label={
        hasItems
          ? t(locale, "header.nav.favorites.ariaCount", { count })
          : t(locale, "header.nav.favorites.aria")
      }
      className="group relative inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          hasItems
            ? "fill-[var(--color-brand-highlight)] text-[var(--color-brand-highlight)]"
            : ""
        }`}
        aria-hidden
      />
      <span className="hidden sm:inline">
        {t(locale, "header.nav.favorites")}
      </span>
      {hasItems && (
        <span
          aria-hidden
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-highlight)] px-1.5 text-[10px] font-bold tabular-nums text-[var(--color-surface)]"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
