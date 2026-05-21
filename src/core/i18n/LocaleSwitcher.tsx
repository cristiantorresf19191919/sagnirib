"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useState, useTransition } from "react";

import {
  brandConfig,
  type SupportedLocale,
} from "@/core/branding/brand-config";
import { stripLocale } from "@/core/i18n/href";

import { LOCALE_LABELS, LOCALE_SHORT, t } from "./messages";
import { setLocale } from "./set-locale-action";

interface LocaleSwitcherProps {
  current: SupportedLocale;
}

/**
 * Header-mounted locale switcher.
 *
 * On select the switcher fires the `setLocale` Server Action (which
 * persists the user preference in a cookie so a future visit to `/`
 * lands on the chosen locale) and then `router.push`-es the current
 * pathname with the locale prefix swapped — e.g. `/es/explorar?city=Cali`
 * becomes `/en/explorar?city=Cali`. The cookie write happens BEFORE the
 * navigation so when the next request's proxy runs it already sees the
 * sticky preference.
 */
export function LocaleSwitcher({ current }: Readonly<LocaleSwitcherProps>) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const choose = (next: SupportedLocale) => {
    setOpen(false);
    if (next === current) return;
    const withoutLocale = stripLocale(pathname);
    const target =
      withoutLocale === "/" ? `/${next}` : `/${next}${withoutLocale}`;
    startTransition(async () => {
      await setLocale(next);
      router.push(target);
      // refresh forces Server Components to re-run with the new
      // x-locale header / cookie — covers paths that aren't yet under
      // [lang] (e.g. legacy redirects mid-migration).
      router.refresh();
    });
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(current, "header.aria.localeLabel", {
          label: LOCALE_LABELS[current],
        })}
        title={LOCALE_LABELS[current]}
        disabled={isPending}
        className="group/locale inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        {LOCALE_SHORT[current]}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t(current, "header.aria.localeMenu")}
          className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
        >
          {brandConfig.supportedLocales.map((loc) => {
            const active = loc === current;
            return (
              <button
                key={loc}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(loc)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                  active
                    ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-background-elevated)]"
                }`}
              >
                <span>{LOCALE_LABELS[loc]}</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-70">
                  {LOCALE_SHORT[loc]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
