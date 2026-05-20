"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useState, useTransition } from "react";

import {
  brandConfig,
  type SupportedLocale,
} from "@/core/branding/brand-config";

import { LOCALE_LABELS, LOCALE_SHORT } from "./messages";
import { setLocale } from "./set-locale-action";

interface LocaleSwitcherProps {
  current: SupportedLocale;
}

/**
 * Header-mounted locale switcher. Click → menu opens; click again →
 * fires the `setLocale` Server Action + `router.refresh()` so server
 * components re-read the cookie. No URL change, no per-locale
 * routing — simplest sticky-language UX for an MVP.
 */
export function LocaleSwitcher({ current }: Readonly<LocaleSwitcherProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const choose = (next: SupportedLocale) => {
    setOpen(false);
    if (next === current) return;
    startTransition(async () => {
      await setLocale(next);
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
        aria-label={`Idioma: ${LOCALE_LABELS[current]}`}
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
          aria-label="Selecciona un idioma"
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
