"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Check, Clock, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

import type { SupportedLocale } from "@/core/branding/brand-config";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import type { ListingsFilters } from "@/server/biringas";

import { encodeFilters, type CatalogView } from "../lib/encode-filters";

type SortKey = NonNullable<ListingsFilters["sortBy"]>;

interface SortMenuProps {
  filters: ListingsFilters;
  view?: CatalogView;
}

interface Option {
  id: SortKey | "default";
  label: string;
  hint: string;
  icon: LucideIcon;
}

function buildOptions(locale: SupportedLocale): ReadonlyArray<Option> {
  return [
    {
      id: "default",
      label: t(locale, "explorar.sort.option.default.label"),
      hint: t(locale, "explorar.sort.option.default.hint"),
      icon: Clock,
    },
    {
      id: "rating",
      label: t(locale, "explorar.sort.option.rating.label"),
      hint: t(locale, "explorar.sort.option.rating.hint"),
      icon: Star,
    },
    {
      id: "price_asc",
      label: t(locale, "explorar.sort.option.priceAsc.label"),
      hint: t(locale, "explorar.sort.option.priceAsc.hint"),
      icon: ArrowUpAZ,
    },
    {
      id: "price_desc",
      label: t(locale, "explorar.sort.option.priceDesc.label"),
      hint: t(locale, "explorar.sort.option.priceDesc.hint"),
      icon: ArrowDownAZ,
    },
  ];
}

function buildHref(
  filters: ListingsFilters,
  next: SortKey | undefined,
  view: CatalogView | undefined,
  locale: SupportedLocale,
): string {
  const copy: ListingsFilters = { ...filters, page: undefined, sortBy: next };
  const params = encodeFilters(copy);
  if (view && view !== "grid3") params.set("view", view);
  const qs = params.toString();
  const base = localizedHref(locale, "/explorar");
  return qs ? `${base}?${qs}` : base;
}

const SPRING = { type: "spring", stiffness: 300, damping: 26, mass: 0.5 } as const;

/**
 * Animated sort dropdown. Server-friendly: each option is a stable Link
 * that the browser follows like any other catalog navigation, so the URL
 * stays the source of truth. The popover itself opens/closes on the
 * client purely for affordance and motion.
 */
export function SortMenu({ filters, view }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const reduceMotion = useReducedMotion();
  const locale = useActiveLocale();
  const OPTIONS = useMemo(() => buildOptions(locale), [locale]);

  const current = filters.sortBy ?? "default";
  const active = OPTIONS.find((o) => o.id === current) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-3.5 pr-3 text-[13px] font-semibold text-[var(--color-foreground)] transition-[border-color,background,box-shadow] duration-200 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
        >
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span
            id={labelId}
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
          >
            {t(locale, "explorar.sort.kicker")}
          </span>
          <span className="text-[13px] text-[var(--color-foreground)]">
            {active.label}
          </span>
        </span>
        <ArrowDown
          className={`ml-1 h-3.5 w-3.5 text-[var(--color-text-subtle)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            role="menu"
            aria-orientation="vertical"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }
            }
            transition={reduceMotion ? { duration: 0.12 } : SPRING}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[280px] origin-top-right rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-lg)] sm:w-[320px]"
          >
            <ul className="flex flex-col gap-0.5">
              {OPTIONS.map((option) => {
                const isActive = current === option.id;
                const next = option.id === "default" ? undefined : option.id;
                const Icon = option.icon;
                return (
                  <li key={option.id} role="none">
                    <Link
                      role="menuitemradio"
                      aria-checked={isActive}
                      href={buildHref(filters, next, view, locale)}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-1 ${
                        isActive
                          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-background-elevated)]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isActive
                            ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
                            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-brand-primary)]/10 group-hover:text-[var(--color-brand-primary)]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="flex flex-col">
                        <span
                          className={`text-[13px] font-semibold ${
                            isActive
                              ? "text-[var(--color-brand-primary)]"
                              : "text-[var(--color-foreground)]"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-subtle)]">
                          {option.hint}
                        </span>
                      </span>
                      {isActive && (
                        <Check
                          className="ml-auto h-4 w-4 text-[var(--color-brand-primary)]"
                          aria-hidden
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
