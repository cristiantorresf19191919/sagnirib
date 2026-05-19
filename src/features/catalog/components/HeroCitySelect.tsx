"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Globe2, MapPin } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

interface CityOption {
  readonly value: string;
  readonly label: string;
}

interface HeroCitySelectProps {
  readonly name: string;
  readonly cities: ReadonlyArray<CityOption>;
  readonly defaultValue?: string;
}

interface PanelPos {
  readonly top: number;
  readonly left: number;
  readonly width: number;
}

const SPRING = { type: "spring", stiffness: 320, damping: 28, mass: 0.55 } as const;

function bubbleClass(isSelected: boolean, isActive: boolean): string {
  if (isSelected) {
    return "bg-[var(--color-forest)] text-[var(--color-cream)]";
  }
  if (isActive) {
    return "bg-[var(--color-forest)]/15 text-[var(--color-forest)]";
  }
  return "bg-[var(--color-cream)] text-[var(--color-ink-soft)] group-hover/opt:bg-[var(--color-forest)]/10 group-hover/opt:text-[var(--color-forest)]";
}

/**
 * Editorial city combobox for the hero search bar.
 *
 * Replaces the native <select> — its browser-default dropdown rendered as a
 * white panel with cream text in dark mode (invisible). This is a fully
 * styled combobox + listbox that pipes the selected value back into the
 * surrounding form via a hidden input, so server-side form handling is
 * unchanged.
 *
 * The popover is portaled into <body> with position:fixed coordinates
 * computed from the trigger's bounding rect. This bypasses every stacking
 * context the hero stacks around the form (suggested chips with pulse-ring
 * animations, trust card avatars, framer-motion transforms on the reveal
 * wrapper) — z-index escalation could not reliably keep the panel on top.
 *
 * Accessibility: implements the ARIA 1.2 combobox pattern with a button
 * trigger and a listbox popup. Arrow keys / Home / End navigate, Enter
 * commits, Escape closes, and a 700 ms type-ahead jumps to the next option
 * whose label starts with the typed prefix.
 */
export function HeroCitySelect({
  name,
  cities,
  defaultValue = "",
}: HeroCitySelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, cities.findIndex((c) => c.value === defaultValue)),
  );
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef<{
    buffer: string;
    timer: ReturnType<typeof setTimeout> | null;
  }>({
    buffer: "",
    timer: null,
  });

  const reduceMotion = useReducedMotion();
  const listId = useId();
  const labelId = useId();

  const selected = useMemo(
    () => cities.find((c) => c.value === value) ?? cities[0],
    [cities, value],
  );

  // Portal target is document.body — only present after client mount.
  useEffect(() => setMounted(true), []);

  // Track the wrapper's bounding rect so the portaled panel stays anchored
  // under the trigger when the window resizes or any ancestor scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 10,
        left: rect.left,
        width: rect.width,
      });
    }
    update();
    globalThis.addEventListener("resize", update);
    // Capture-phase listener catches scrolls on any ancestor, not just window.
    globalThis.addEventListener("scroll", update, true);
    return () => {
      globalThis.removeEventListener("resize", update);
      globalThis.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (next: CityOption) => {
      setValue(next.value);
      setActiveIndex(cities.indexOf(next));
      close();
    },
    [cities, close],
  );

  // Click-outside: check the portaled panel (panelRef) AND the trigger.
  // Using listRef here would miss clicks on the panel header / caret.
  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => listRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  function handleTriggerKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(cities.length - 1);
    }
  }

  function handleListKey(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % cities.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + cities.length) % cities.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(cities.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(cities[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const ta = typeaheadRef.current;
      ta.buffer = (ta.buffer + event.key).toLowerCase();
      if (ta.timer) globalThis.clearTimeout(ta.timer);
      ta.timer = globalThis.setTimeout(() => {
        ta.buffer = "";
        ta.timer = null;
      }, 700);
      const match = cities.findIndex((c) =>
        c.label.toLowerCase().startsWith(ta.buffer),
      );
      if (match >= 0) setActiveIndex(match);
    }
  }

  const IconForOption = (city: CityOption): LucideIcon =>
    city.value === "" ? Globe2 : MapPin;

  const panel =
    open && pos ? (
      <motion.div
        ref={panelRef}
        // Enter: slide + scale ONLY — no opacity. Animating opacity made
        // the panel translucent during the spring and let things bleed
        // through. Exit keeps the opacity fade-out since the panel is
        // leaving anyway.
        initial={reduceMotion ? false : { y: -8, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -6, scale: 0.98 }
        }
        transition={reduceMotion ? { duration: 0.12 } : SPRING}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 60,
        }}
        className="origin-top"
      >
        {/* Gold rim glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[1px] rounded-[calc(var(--radius-xl)+2px)] bg-gradient-to-b from-[var(--color-gold)]/35 via-transparent to-transparent opacity-70"
        />
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-cream-soft)] shadow-[0_24px_60px_-18px_rgba(20,28,24,0.45),0_10px_24px_-12px_rgba(20,28,24,0.25)]">
          {/* Caret pointing at the trigger */}
          <span
            aria-hidden
            className="absolute -top-1.5 left-7 h-3 w-3 rotate-45 border-l border-t border-[var(--color-line)] bg-[var(--color-cream-soft)]"
          />
          <div className="border-b border-[var(--color-line-soft)] px-4 pb-1.5 pt-2.5">
            <span className="text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              Elige ciudad
            </span>
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${listId}-opt-${activeIndex}`}
            onKeyDown={handleListKey}
            // max-h capped so the panel never reaches the marquee tape at
            // the bottom of the hero. ~5 cities visible at once, the rest
            // reachable via scroll or arrow keys.
            className="max-h-[260px] overflow-y-auto p-1.5 focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {cities.map((city, idx) => {
              const isSelected = city.value === value;
              const isActive = idx === activeIndex;
              const Icon = IconForOption(city);
              return (
                <li
                  key={city.value || "all"}
                  id={`${listId}-opt-${idx}`}
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(city)}
                  className={`group/opt flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--color-forest)]/10 text-[var(--color-ink)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-cream)]/60"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${bubbleClass(isSelected, isActive)}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {city.label}
                  </span>
                  {isSelected && (
                    <Check
                      className="h-4 w-4 text-[var(--color-forest)]"
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ul>
          {/* Bottom fade — hints there is more content below the visible
              area when the list overflows. pointer-events:none keeps the
              last visible row fully clickable. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[var(--radius-xl)] bg-gradient-to-t from-[var(--color-cream-soft)] to-transparent"
          />
        </div>
      </motion.div>
    ) : null;

  return (
    <div
      ref={wrapperRef}
      data-testid="hero-city-select"
      className="group/city relative block rounded-[var(--radius-xl)] transition-colors duration-200 md:flex-[0_0_38%] md:rounded-none md:border-r md:border-[var(--color-line-soft)]"
    >
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={handleTriggerKey}
        className="flex w-full flex-col items-stretch rounded-[var(--radius-xl)] px-4 py-2 text-left transition-colors duration-200 hover:bg-[var(--color-cream)]/40 focus:outline-none focus-visible:bg-[var(--color-cream)]/40 focus-visible:ring-2 focus-visible:ring-[var(--color-forest)]/45 md:rounded-none md:px-5 md:py-2.5"
      >
        <span
          id={labelId}
          className="block text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] opacity-80"
        >
          Ciudad
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 pr-5 relative">
          <span className="truncate text-sm font-medium text-[var(--color-ink)]">
            {selected?.label}
          </span>
          <ChevronDown
            className={`pointer-events-none absolute right-0 h-3 w-3 text-[var(--color-ink-soft)] transition-transform duration-300 ease-[var(--ease-standard)] ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </span>
      </button>
      {mounted &&
        createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body)}
    </div>
  );
}
