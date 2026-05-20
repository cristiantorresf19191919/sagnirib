"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";

import { useLocale } from "@/core/i18n/LocaleProvider";
import { t } from "@/core/i18n/messages";
import { toast } from "@/shared/ui/toast";

import { useSavedSearches } from "../lib/use-saved-searches";

interface SaveSearchButtonProps {
  /** Human-readable label that summarises the current search. */
  label: string;
  /** Replay URL (typically `/explorar?…`). */
  href: string;
  /** Extra classes for placement. */
  className?: string;
}

/**
 * Inline "Save this search" button — surfaces inside catalog headers
 * once a user has applied at least one filter. Idempotent: re-saving
 * the same href just bumps it to the top of the saved list.
 */
export function SaveSearchButton({
  label,
  href,
  className,
}: Readonly<SaveSearchButtonProps>) {
  const locale = useLocale();
  const { ready, searches, save } = useSavedSearches();
  const already = ready && searches.some((s) => s.href === href);

  const handleClick = () => {
    save({ label, href });
    toast.success(
      t(
        locale,
        already
          ? "savedSearch.toast.updatedTitle"
          : "savedSearch.toast.savedTitle",
      ),
      t(locale, "savedSearch.toast.body"),
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="save-search-button"
      aria-pressed={already}
      className={
        className ??
        "inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-foreground)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      }
    >
      {already ? (
        <BookmarkCheck className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
      {already
        ? t(locale, "savedSearch.saved")
        : t(locale, "savedSearch.save")}
    </button>
  );
}
