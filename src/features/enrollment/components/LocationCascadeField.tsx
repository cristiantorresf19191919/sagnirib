"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { t } from "@/core/i18n/messages";
import { useActiveLocale } from "@/core/i18n/use-active-locale";
import type { LocationDepartment } from "../lib/catalogs";

interface LocationValue {
  city: string;
  locality: string;
}

interface LocationCascadeFieldProps {
  locations: ReadonlyArray<LocationDepartment>;
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
}

type Level = "department" | "city" | "locality";

/**
 * Single, self-contained location picker that replaces the old trio of native
 * `<select>`s (Departamento / Ciudad / Localidad). It reads as ONE beautiful
 * field: a styled trigger that shows the chosen place, and a popover that
 * walks the cascade one level at a time — pick a department, it becomes a tag
 * at the top and the panel slides to that department's cities, pick a city and
 * (when relevant) it slides on to localities. Each level is searchable.
 *
 * The department is UI-only context (derived from the city, never persisted) —
 * exactly like the previous implementation — so on commit we only emit
 * `{ city, locality }`.
 */
export function LocationCascadeField({
  locations,
  value,
  onChange,
  onBlur,
  required,
  error,
}: LocationCascadeFieldProps) {
  const locale = useActiveLocale();
  const tr = (k: string) => t(locale, k);

  const derivedDept = useMemo(
    () =>
      locations.find((d) => d.cities.some((c) => c.name === value.city))?.name ??
      "",
    [locations, value.city],
  );

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>("department");
  const [pendingDept, setPendingDept] = useState("");
  const [pendingCity, setPendingCity] = useState("");
  const [query, setQuery] = useState("");
  // +1 → drilling deeper (slide left), -1 → stepping back (slide right).
  const [direction, setDirection] = useState<1 | -1>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const labelId = useId();

  const deptObj = locations.find((d) => d.name === pendingDept);
  const cityObj = deptObj?.cities.find((c) => c.name === pendingCity);

  // Open at the level that matches the current selection so editing lands the
  // user where the action is (a chosen city opens straight on its cities list).
  function openPicker() {
    if (value.city) {
      setPendingDept(derivedDept);
      setPendingCity(value.city);
      setLevel("city");
    } else {
      setPendingDept("");
      setPendingCity("");
      setLevel("department");
    }
    setQuery("");
    setDirection(1);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    onBlur?.();
  }

  function goTo(next: Level, dir: 1 | -1) {
    setDirection(dir);
    setQuery("");
    setLevel(next);
  }

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open, level]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickDepartment(name: string) {
    setPendingDept(name);
    setPendingCity("");
    goTo("city", 1);
  }

  function pickCity(name: string) {
    const city = deptObj?.cities.find((c) => c.name === name);
    setPendingCity(name);
    if (city && city.localities.length > 0) {
      goTo("locality", 1);
    } else {
      onChange({ city: name, locality: "" });
      close();
    }
  }

  function pickLocality(loc: string) {
    onChange({ city: pendingCity, locality: loc });
    close();
  }

  // Filtered options for the active level.
  const q = query.trim().toLowerCase();
  const deptOptions = locations.filter((d) =>
    d.name.toLowerCase().includes(q),
  );
  const cityOptions = (deptObj?.cities ?? []).filter((c) =>
    c.name.toLowerCase().includes(q),
  );
  const localityOptions = (cityObj?.localities ?? []).filter((l) =>
    l.toLowerCase().includes(q),
  );

  const levelTitle =
    level === "department"
      ? tr("step.details.location.step.department")
      : level === "city"
        ? tr("step.details.location.step.city")
        : tr("step.details.location.step.locality");

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <span
        id={labelId}
        className="text-[12px] font-semibold tracking-tight text-[var(--color-foreground)]"
      >
        {tr("step.details.location.label")}
        {required ? null : (
          <span className="ml-1 font-normal text-[var(--color-text-subtle)]">
            {tr("step.details.location.optionalHint")}
          </span>
        )}
      </span>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => (open ? close() : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={labelId}
          className={`flex h-12 w-full items-center gap-2.5 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 text-left text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30 ${
            error
              ? "border-[var(--color-brand-highlight)]"
              : open
                ? "border-[var(--color-brand-primary)]"
                : "border-[var(--color-border)]"
          }`}
        >
          <MapPin
            className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]"
            aria-hidden
          />
          {value.city ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium text-[var(--color-foreground)]">
                {value.locality ? `${value.locality} · ${value.city}` : value.city}
              </span>
              {derivedDept && (
                <span className="hidden shrink-0 rounded-full bg-[var(--color-brand-primary)]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/15 sm:inline">
                  {derivedDept}
                </span>
              )}
            </span>
          ) : (
            <span className="flex-1 text-[var(--color-text-subtle)]">
              {tr("step.details.location.placeholder")}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--color-text-subtle)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label={tr("step.details.location.label")}
              initial={{ opacity: 0, y: -6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
            >
              {/* Breadcrumb / context tags */}
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
                {level !== "department" && (
                  <button
                    type="button"
                    onClick={() =>
                      goTo(level === "locality" ? "city" : "department", -1)
                    }
                    aria-label={tr("step.details.location.back")}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {pendingDept && (
                    <button
                      type="button"
                      onClick={() => goTo("department", -1)}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20 transition-colors hover:bg-[var(--color-brand-primary)]/15"
                    >
                      {pendingDept}
                      {level !== "department" && <X className="h-3 w-3" aria-hidden />}
                    </button>
                  )}
                  {pendingDept && pendingCity && level === "locality" && (
                    <>
                      <ChevronRight
                        className="h-3 w-3 shrink-0 text-[var(--color-text-subtle)]"
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => goTo("city", -1)}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20 transition-colors hover:bg-[var(--color-brand-primary)]/15"
                      >
                        {pendingCity}
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </>
                  )}
                  {!pendingDept && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                      {levelTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative border-b border-[var(--color-border)] px-3 py-2">
                <Search
                  className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]"
                  aria-hidden
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`${tr("step.details.location.searchIn")} ${levelTitle.toLowerCase()}…`}
                  className="h-9 w-full rounded-[var(--radius-md)] bg-[var(--color-background-elevated)] pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/30"
                />
              </div>

              {/* Options — slide between levels */}
              <div className="relative max-h-[min(52vh,320px)] overflow-y-auto overscroll-contain p-1.5">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.ul
                    key={level + (pendingDept || "") + (pendingCity || "")}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-0.5"
                  >
                    {level === "department" &&
                      (deptOptions.length === 0 ? (
                        <EmptyRow label={tr("step.details.location.empty")} />
                      ) : (
                        deptOptions.map((d) => (
                          <OptionRow
                            key={d.name}
                            label={d.name}
                            meta={t(locale, "step.details.location.cityCount", {
                              count: d.cities.length,
                            })}
                            selected={d.name === derivedDept}
                            trailing="chevron"
                            onClick={() => pickDepartment(d.name)}
                          />
                        ))
                      ))}

                    {level === "city" &&
                      (cityOptions.length === 0 ? (
                        <EmptyRow label={tr("step.details.location.empty")} />
                      ) : (
                        cityOptions.map((c) => (
                          <OptionRow
                            key={c.name}
                            label={c.name}
                            meta={
                              c.localities.length > 0
                                ? t(locale, "step.details.location.zoneCount", {
                                    count: c.localities.length,
                                  })
                                : undefined
                            }
                            selected={c.name === value.city}
                            trailing={c.localities.length > 0 ? "chevron" : "check"}
                            onClick={() => pickCity(c.name)}
                          />
                        ))
                      ))}

                    {level === "locality" && (
                      <>
                        <OptionRow
                          label={tr("step.details.location.anyZone")}
                          selected={!value.locality && pendingCity === value.city}
                          trailing="check"
                          muted
                          onClick={() => pickLocality("")}
                        />
                        {localityOptions.map((l) => (
                          <OptionRow
                            key={l}
                            label={l}
                            selected={l === value.locality}
                            trailing="check"
                            onClick={() => pickLocality(l)}
                          />
                        ))}
                      </>
                    )}
                  </motion.ul>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <span role="alert" className="text-[11px] text-[var(--color-brand-highlight)]">
          {error}
        </span>
      )}
    </div>
  );
}

interface OptionRowProps {
  label: string;
  meta?: string;
  selected?: boolean;
  trailing: "chevron" | "check";
  muted?: boolean;
  onClick: () => void;
}

function OptionRow({ label, meta, selected, trailing, muted, onClick }: OptionRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
          selected
            ? "bg-[var(--color-brand-primary)]/8 font-semibold text-[var(--color-brand-primary)]"
            : "text-[var(--color-foreground)] hover:bg-[var(--color-background-elevated)]"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${muted ? "italic text-[var(--color-text-muted)]" : ""}`}>
          {label}
        </span>
        {meta && (
          <span className="shrink-0 text-[11px] font-normal text-[var(--color-text-subtle)]">
            {meta}
          </span>
        )}
        {trailing === "chevron" ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]" aria-hidden />
        ) : selected ? (
          <Check className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]" aria-hidden />
        ) : (
          <span className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
    </li>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <li className="px-3 py-6 text-center text-[12px] text-[var(--color-text-subtle)]">
      {label}
    </li>
  );
}
