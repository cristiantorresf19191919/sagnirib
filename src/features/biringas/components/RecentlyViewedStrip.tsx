"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import { Container } from "@/shared/design-system/components/Container";

import {
  clearRecentlyViewed,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "../store/recently-viewed";

const VISIBLE_LIMIT = 6;

/**
 * Sticky horizontal strip of the user's last 6 viewed profiles.
 *
 * Mounts on home + profile pages. Renders nothing on the server (the
 * snapshot is empty) and nothing for users with fewer than 2 entries — a
 * single profile isn't a "list", and an empty strip would just be visual
 * noise. Both invariants protect against layout shift on first paint.
 *
 * The strip lives in normal flow (not `position: fixed`) so it doesn't
 * cover content on small screens; users scroll to it as part of the page.
 */
export function RecentlyViewedStrip() {
  const locale = useActiveLocale();
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!snapshot.ready || snapshot.entries.length < 2) return null;
  const visible = snapshot.entries.slice(0, VISIBLE_LIMIT);

  return (
    <section
      data-testid="recently-viewed-strip"
      aria-label={t(locale, "recentlyViewed.title")}
      className="border-t border-[var(--color-border)]/60 bg-[var(--color-background-elevated)]/60 py-5 sm:py-6"
    >
      <Container width="wide">
        <header className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            <Clock
              className="h-3.5 w-3.5 text-[var(--color-brand-primary)]"
              aria-hidden
            />
            {t(locale, "recentlyViewed.title")}
          </h2>
          <button
            type="button"
            data-testid="recently-viewed-clear"
            onClick={() => clearRecentlyViewed()}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand-highlight)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <X className="h-3 w-3" aria-hidden />
            {t(locale, "recentlyViewed.clear")}
          </button>
        </header>

        <ul
          data-testid="recently-viewed-list"
          className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((entry) => (
            <li
              key={entry.id}
              data-testid={`recently-viewed-card-${entry.slug}`}
              className="snap-start shrink-0"
            >
              <Link
                href={localizedHref(locale, `/p/${entry.slug}`)}
                className="group flex w-[148px] flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-brand-primary-soft)] hover:shadow-[var(--shadow-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                  <Image
                    src={entry.image}
                    alt={entry.name}
                    fill
                    sizes="148px"
                    className="object-cover transition-[filter] duration-300 ease-[var(--ease-standard)] group-hover:saturate-[1.08]"
                  />
                </div>
                <div className="flex flex-col gap-0.5 px-0.5 pb-0.5">
                  <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                    {entry.name}
                  </span>
                  <span className="truncate text-[11px] text-[var(--color-text-muted)]">
                    {entry.city}
                  </span>
                  <span className="mt-1 truncate font-[var(--font-display)] text-xs font-bold tabular-nums text-[var(--color-foreground)]">
                    {entry.price}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
