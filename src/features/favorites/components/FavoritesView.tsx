"use client";

import { useMemo } from "react";
import { ArrowRight, GitCompareArrows, Heart } from "lucide-react";

import { t } from "@/core/i18n/messages";
import {
  useActiveLocale,
  useLocalizedHref,
} from "@/core/i18n/use-active-locale";
import type { BiringaListing } from "@/server/biringas";
import { CatalogCard } from "@/features/catalog/components/CatalogCard";
import { Button } from "@/shared/design-system/components/Button";

import { COMPARE_LIMIT, useFavorites } from "../store/use-favorites";
import { CompareDrawer } from "./CompareDrawer";
import { CompareToggle } from "./CompareToggle";

interface FavoritesViewProps {
  listings: ReadonlyArray<BiringaListing>;
}

export function FavoritesView({ listings }: Readonly<FavoritesViewProps>) {
  const locale = useActiveLocale();
  const exploreHref = useLocalizedHref("/explorar");
  const {
    favorites,
    compareIds,
    ready,
    clearCompare,
    setCompare,
  } = useFavorites();

  const byId = useMemo(() => {
    const map = new Map<string, BiringaListing>();
    for (const l of listings) map.set(l.id, l);
    return map;
  }, [listings]);

  const favoriteListings = useMemo(
    () => favorites.map((id) => byId.get(id)).filter(Boolean) as BiringaListing[],
    [favorites, byId],
  );

  const compareListings = useMemo(
    () => compareIds.map((id) => byId.get(id)).filter(Boolean) as BiringaListing[],
    [compareIds, byId],
  );

  const remainingForCompare = useMemo(
    () => favoriteListings.filter((l) => !compareIds.includes(l.id)),
    [favoriteListings, compareIds],
  );

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-[var(--color-text-subtle)]">
          {t(locale, "favoritas.loading")}
        </span>
      </div>
    );
  }

  if (favoriteListings.length === 0) {
    return <EmptyState exploreHref={exploreHref} />;
  }

  const canQuickVersus =
    favoriteListings.length >= 2 && compareIds.length < COMPARE_LIMIT;

  function startQuickVersus() {
    const ids = favoriteListings
      .slice(0, COMPARE_LIMIT)
      .map((l) => l.id);
    setCompare(ids);
  }

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
            <Heart
              className="h-3 w-3 fill-[var(--color-brand-highlight)] text-[var(--color-brand-highlight)]"
              aria-hidden
            />
            {t(locale, "favoritas.kicker")}
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-4xl lg:text-5xl">
            <span>{t(locale, "favoritas.title")}</span>
            <span className="ml-3 align-middle text-2xl font-normal text-[var(--color-text-muted)] sm:text-3xl">
              · {favoriteListings.length}
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            {t(locale, "favoritas.subtitle")}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canQuickVersus && (
            <button
              type="button"
              onClick={startQuickVersus}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-[background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-brand-primary-strong)]"
            >
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "favoritas.quickVersus")}
            </button>
          )}
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-foreground)]"
            >
              {t(locale, "favoritas.clearVersus")}
            </button>
          )}
          <Button href={exploreHref} variant="secondary" size="sm">
            {t(locale, "favoritas.keepExploring")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </header>

      {compareIds.length === 0 && favoriteListings.length >= 2 && (
        <div className="mt-8 flex items-start gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/5 px-4 py-3 text-sm">
          <GitCompareArrows
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-primary-strong)]"
            aria-hidden
          />
          <p className="text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-foreground)]">
              {t(locale, "favoritas.compareHint.title")}
            </span>{" "}
            {t(locale, "favoritas.compareHint.bodyA")}{" "}
            <em>{t(locale, "favoritas.compareHint.versus")}</em>{" "}
            {t(locale, "favoritas.compareHint.bodyB")}{" "}
            <em className="text-[var(--color-foreground)]">
              {t(locale, "favoritas.compareHint.compare")}
            </em>{" "}
            {t(locale, "favoritas.compareHint.bodyC")}
          </p>
        </div>
      )}

      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoriteListings.map((listing, i) => (
          <li key={listing.id} className="flex flex-col gap-2">
            <CatalogCard
              listing={listing}
              locale={locale}
              priority={i === 0}
            />
            <CompareToggle listingId={listing.id} variant="block" />
          </li>
        ))}
      </ul>

      {compareIds.length > 0 && <div aria-hidden className="h-[60vh]" />}

      <CompareDrawer
        listings={compareListings}
        remaining={remainingForCompare}
      />
    </>
  );
}

function EmptyState({ exploreHref }: { exploreHref: string }) {
  const locale = useActiveLocale();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-20 text-center">
      <span
        aria-hidden
        className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand-highlight)] shadow-[var(--shadow-md)]"
      >
        <Heart className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-[var(--color-foreground)] sm:text-4xl">
        {t(locale, "favoritas.empty.title")}
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
        {t(locale, "favoritas.empty.body")}
      </p>
      <Button href={exploreHref} variant="primary" size="lg">
        {t(locale, "favoritas.empty.cta")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
