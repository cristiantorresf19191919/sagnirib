"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Cherry,
  Flame,
  Heart,
  Moon,
  MoonStar,
  Sparkles,
  Sun,
} from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import {
  DEFAULT_THEME,
  THEME_COOKIE,
  VALID_THEMES,
  type Theme,
} from "./theme-cookie";

const STORAGE_KEY = THEME_COOKIE;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const listeners = new Set<() => void>();

/**
 * Apply the theme to <html> + persist it + notify subscribers. Centralised
 * so the toggle handler stays small. localStorage may throw in private
 * mode / over quota — caught and ignored so the toggle still works for
 * the session. The cookie write is what lets the next Server Component
 * render emit `data-theme` directly, so a `router.refresh()` after the
 * locale switcher cannot strip the attribute mid-reconciliation.
 */
function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // No-op: storage failures are non-fatal for theme.
  }
  try {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  } catch {
    // No-op: cookie write failures are non-fatal — server falls back to default.
  }
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr && VALID_THEMES.has(attr as Theme)) return attr as Theme;
  return DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  // SSR default — the layout SSR-emits `data-theme` from the cookie, and
  // `ThemeScript` covers the first-visit case before paint.
  return DEFAULT_THEME;
}

const THEME_NAME: Record<Theme, string> = {
  light: "Claro",
  dark: "Oscuro",
  desire: "Deseo",
  bloom: "Bloom",
  ember: "Ember",
  amour: "Amour",
  noir: "Noir",
};

/**
 * Visual signature per theme — the small chip/halo color that
 * telegraphs the active mood.
 * Used by the halo and (where applicable) the conic iridescent ring.
 */
const ACCENT: Record<Theme, string> = {
  light: "#2F5D43",
  dark: "#88BDA1",
  desire: "#EFC3E4",
  bloom: "#6E2A82",
  ember: "#F4828B",
  amour: "#9A1F35",
  noir: "#8FB3FF",
};

/** Soft radial halo behind the icon for "colored" themes — keeps the
 *  toggle visually quiet in plain light/dark, lit in every other mood. */
const HALO: Record<Theme, string> = {
  light: "rgba(47,93,67,0)",
  dark: "rgba(136,189,161,0)",
  desire: "rgba(239,195,228,0.42)",
  bloom: "rgba(110,42,130,0.32)",
  ember: "rgba(244,130,139,0.40)",
  amour: "rgba(154,31,53,0.30)",
  noir: "rgba(143,179,255,0.38)",
};

/** Per-theme conic-gradient ring painted INSIDE the toggle border for the
 *  colored themes. `null` means no ring (light + dark stay calm). */
const RING: Record<Theme, string | null> = {
  light: null,
  dark: null,
  desire:
    "conic-gradient(from 0deg, rgba(239,195,228,0) 0deg, rgba(239,195,228,0.65) 80deg, rgba(255,107,170,0.5) 160deg, rgba(239,199,133,0.55) 240deg, rgba(239,195,228,0) 360deg)",
  bloom:
    "conic-gradient(from 0deg, rgba(110,42,130,0) 0deg, rgba(110,42,130,0.45) 80deg, rgba(209,65,134,0.4) 160deg, rgba(217,146,94,0.45) 240deg, rgba(110,42,130,0) 360deg)",
  ember:
    "conic-gradient(from 0deg, rgba(244,130,139,0) 0deg, rgba(244,130,139,0.65) 80deg, rgba(255,90,122,0.55) 160deg, rgba(240,172,122,0.55) 240deg, rgba(244,130,139,0) 360deg)",
  amour:
    "conic-gradient(from 0deg, rgba(154,31,53,0) 0deg, rgba(154,31,53,0.5) 80deg, rgba(209,65,134,0.45) 160deg, rgba(201,145,97,0.5) 240deg, rgba(154,31,53,0) 360deg)",
  noir:
    "conic-gradient(from 0deg, rgba(143,179,255,0) 0deg, rgba(143,179,255,0.65) 80deg, rgba(102,232,255,0.55) 160deg, rgba(226,198,133,0.5) 240deg, rgba(143,179,255,0) 360deg)",
};

/** Lucide icon per theme. */
const ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  desire: Flame,
  bloom: Sparkles,
  ember: Heart,
  amour: Cherry,
  noir: MoonStar,
};

const THEMES = Object.keys(ICON) as Theme[];

const SPRING = { type: "spring", stiffness: 300, damping: 26, mass: 0.5 } as const;

/**
 * Header-mounted theme picker. Opens a dropdown listing all seven moods
 * so users can jump directly to any theme without cycling blindly.
 *
 * The button shows the icon + halo of the CURRENT theme — it's both
 * trigger and status indicator. The dropdown uses the same spring-animated
 * popover pattern as SortMenu.
 *
 * Implementation notes:
 *  - `useSyncExternalStore` reads the canonical theme directly from the
 *    DOM — no `useEffect` sync, no cascade renders.
 *  - `suppressHydrationWarning` on icons + halo because the post-paint
 *    theme can legitimately differ from the server default once
 *    `ThemeScript` has run.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const menuId = useId();

  const isColored = theme !== "light" && theme !== "dark";
  const ring = RING[theme];

  // Focus active item when menu opens (ARIA menu pattern).
  useEffect(() => {
    if (!open || !popoverRef.current) return;
    const items = popoverRef.current.querySelectorAll<HTMLButtonElement>(
      '[role="menuitemradio"]',
    );
    const activeIndex = THEMES.indexOf(theme);
    (items[activeIndex] ?? items[0])?.focus();
  }, [open, theme]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (!popoverRef.current) return;
      const items = Array.from(
        popoverRef.current.querySelectorAll<HTMLButtonElement>(
          '[role="menuitemradio"]',
        ),
      );
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
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
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="theme-toggle"
        data-theme-state={theme}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Tema: ${THEME_NAME[theme]}`}
        title={`Tema: ${THEME_NAME[theme]}`}
        className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-glow-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        {/* Conic iridescent ring — paints in every "colored" state with a
            palette-specific gradient. Slowly rotates so the switcher
            feels lit when not in plain light/dark. */}
        <span
          aria-hidden
          suppressHydrationWarning
          className={`pointer-events-none absolute inset-[2px] rounded-full transition-opacity duration-500 ease-[var(--ease-standard)] motion-safe:animate-[border-flow_9s_linear_infinite] ${
            ring ? "opacity-100" : "opacity-0"
          }`}
          style={
            ring
              ? {
                  background: ring,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  padding: "1px",
                }
              : undefined
          }
        />

        {/* Stacked per-theme icons — only the active one is visible. The
            rotation direction varies so the icon swap feels different
            in each step (less mechanical than a single keyframe). */}
        {THEMES.map((t) => {
          const Icon = ICON[t];
          const isActive = theme === t;
          const rest =
            t === "light"
              ? "rotate-90 scale-50"
              : t === "dark"
                ? "-rotate-90 scale-50"
                : t === "desire"
                  ? "rotate-180 scale-50"
                  : t === "bloom"
                    ? "rotate-45 scale-50"
                    : t === "ember"
                      ? "-rotate-45 scale-50"
                      : t === "amour"
                        ? "rotate-12 scale-50"
                        : "-rotate-180 scale-50";
          const colorStyle: React.CSSProperties =
            t === "dark" || t === "light" ? {} : { color: ACCENT[t] };
          return (
            <span
              key={t}
              suppressHydrationWarning
              className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
                t === "dark" ? "text-[var(--color-brand-primary)]" : ""
              } ${isActive ? "opacity-100 rotate-0 scale-100" : `opacity-0 ${rest}`}`}
              style={colorStyle}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          );
        })}

        {/* Soft glow halo behind the icon — tinted with the CURRENT theme
            accent so the button itself signals the active mood. Only the
            colored themes light this up. */}
        <span
          aria-hidden
          suppressHydrationWarning
          className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500 ease-[var(--ease-standard)] ${
            isColored ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(closest-side, ${HALO[theme]}, transparent 78%)`,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            id={menuId}
            role="menu"
            aria-label="Seleccionar tema"
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
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 origin-top-right rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-lg)]"
          >
            <ul className="flex flex-col gap-0.5">
              {THEMES.map((t) => {
                const Icon = ICON[t];
                const isActive = theme === t;
                return (
                  <li key={t} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => {
                        applyTheme(t);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={`group/item flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-1 ${
                        isActive
                          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-background-elevated)]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isActive
                            ? "bg-[var(--color-brand-primary)] text-[var(--color-surface)]"
                            : "bg-[var(--color-surface-muted)] group-hover/item:bg-[var(--color-brand-primary)]/10"
                        }`}
                        style={
                          !isActive ? { color: ACCENT[t] } : undefined
                        }
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="flex-1 text-left text-[13px] font-semibold">
                        {THEME_NAME[t]}
                      </span>
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0 rounded-full ring-1 ring-[var(--color-border)]"
                        style={{ background: ACCENT[t] }}
                      />
                      {isActive && (
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-primary)]"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
