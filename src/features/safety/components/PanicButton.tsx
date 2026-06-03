"use client";

import { EyeOff } from "lucide-react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";

import { usePanic } from "./PanicProvider";

/**
 * Deliberately understated quick-exit control. One muted icon that, when
 * pressed, hands off to `PanicProvider` and paints a neutral news site over
 * the whole app (see `PanicNewsScreen`). Kept visually quiet so it reads as a
 * minor utility, not a flashing alarm — but it has a 44×44 touch target and a
 * clear aria-label for the people who need it. Restore with `Escape` or by
 * clicking the news masthead.
 */
export function PanicButton() {
  const locale = useActiveLocale();
  const { trigger } = usePanic();

  return (
    <button
      type="button"
      onClick={trigger}
      aria-label={t(locale, "safety.panic.aria")}
      title={t(locale, "safety.panic.tooltip")}
      data-testid="panic-button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-subtle)] opacity-70 transition-[color,opacity,background] duration-200 ease-[var(--ease-standard)] hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <EyeOff className="h-4 w-4" aria-hidden />
    </button>
  );
}
