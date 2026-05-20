"use client";

import { Flame, Moon, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "biringas:theme";
const HINT_DISMISSED_KEY = "biringas:theme-hint-dismissed";

type Theme = "light" | "dark" | "bloom" | "desire";

const listeners = new Set<() => void>();

/**
 * Apply the theme to <html> + persist it + notify subscribers. Centralised
 * so the toggle handler stays small. localStorage may throw in private
 * mode / over quota — caught and ignored so the toggle still works for
 * the session.
 */
function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // No-op: storage failures are non-fatal for theme.
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
  if (attr === "dark") return "dark";
  if (attr === "bloom") return "bloom";
  if (attr === "desire") return "desire";
  return "light";
}

function getServerSnapshot(): Theme {
  // SSR default — `ThemeScript` overrides via pre-paint inline script
  // before this component renders on the client.
  return "light";
}

/** Cycle: light → dark → desire (violet dark) → bloom (violet light) → light. */
const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "desire",
  desire: "bloom",
  bloom: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Cambiar a tema oscuro",
  dark: "Cambiar a tema violeta oscuro",
  desire: "Cambiar a tema violeta claro",
  bloom: "Cambiar a tema claro",
};

/**
 * Visual signature per theme — the small chip/halo color that
 * telegraphs what the toggle will switch INTO on the next click.
 * Light → forest green. Dark → mint. Bloom → royal mauve. Desire →
 * iridescent rose-mauve. Used by the icon tint AND the halo glow so
 * the switcher itself acts as a tiny color preview.
 */
const ACCENT: Record<Theme, string> = {
  light: "#2F5D43",
  dark: "#88BDA1",
  bloom: "#6E2A82",
  desire: "#EFC3E4",
};

const HALO: Record<Theme, string> = {
  light: "rgba(47,93,67,0)",
  dark: "rgba(136,189,161,0)",
  bloom: "rgba(110,42,130,0.32)",
  desire: "rgba(239,195,228,0.42)",
};

/**
 * Header-mounted theme toggle. Four moods on a cycle:
 *  - `light`  → cream paper + forest CTAs.
 *  - `dark`   → candlelit ink + mint CTAs.
 *  - `bloom`  → pale lavender paper + royal-mauve CTAs (light violet).
 *  - `desire` → midnight aubergine + iridescent mauve CTAs (dark violet).
 *
 * Four icons stacked (sun, moon, sparkles, flame) crossfade + rotate +
 * scale as the cycle progresses. The button also paints a soft halo
 * tinted with the OUTGOING accent and a conic-gradient ring that only
 * shows in the two violet states — turning the switcher itself into a
 * tiny mood preview. Uses `useSyncExternalStore` to read the canonical
 * theme directly from the DOM — no `useEffect` sync, no cascade renders.
 * `suppressHydrationWarning` on the icons + halo because the post-paint
 * theme can legitimately differ from the server default once
 * `ThemeScript` has run.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = () => {
    applyTheme(NEXT_THEME[theme]);
    dismissHint();
  };
  const isViolet = theme === "bloom" || theme === "desire";

  // First-time hint: nudge dark-mode users toward the violet variants
  // they may never discover. Shows ONCE per browser, only when the user
  // landed in `dark` (already past the first cycle step) and has not
  // dismissed the hint before. Auto-dismisses after 8s; clicking the
  // toggle dismisses it permanently.
  const [hintVisible, setHintVisible] = useState(false);
  useEffect(() => {
    if (theme !== "dark") return;
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(HINT_DISMISSED_KEY) === "1") return;
    } catch {
      return;
    }
    // Small delay so the hint doesn't appear during page-load animations.
    const showTimer = window.setTimeout(() => setHintVisible(true), 1200);
    const hideTimer = window.setTimeout(() => {
      setHintVisible(false);
    }, 9200);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [theme]);

  function dismissHint() {
    setHintVisible(false);
    try {
      window.localStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <span className="relative inline-flex">
      {hintVisible && (
        <div
          data-testid="theme-hint"
          role="status"
          aria-live="polite"
          className="motion-safe:motion-hero-reveal absolute right-0 top-12 z-50 w-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-md)]"
        >
          {/* Caret pointing back to the toggle. Border on two sides + matching
              surface fill makes it look like a continuation of the popover
              edge. Anchored under the toggle's horizontal midpoint. */}
          <span
            aria-hidden
            className="absolute -top-1.5 right-[14px] h-3 w-3 rotate-45 border-l border-t border-[var(--color-border)] bg-[var(--color-surface)]"
          />

          {/* Top row: eyebrow + close. The X is the only focusable element
              inside the hint so dismiss is keyboard-reachable; clicking the
              toggle below also dismisses (existing behavior). */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles
                className="h-3.5 w-3.5"
                style={{ color: "#E5B7DA" }}
                aria-hidden
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: "#E5B7DA" }}
              >
                Nuevo
              </span>
            </span>
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Cerrar sugerencia"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>

          {/* Body copy — natural two-line flow at this width. */}
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-foreground)]">
            Toca otra vez para probar el modo{" "}
            <span className="font-semibold" style={{ color: "#E5B7DA" }}>
              violeta
            </span>
            .
          </p>

          {/* Palette preview — three swatches that telegraph the violet
              moods the user will unlock. Order goes deep → soft to read
              left-to-right like a gradient. */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Vista previa
            </span>
            <span aria-hidden className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full ring-1 ring-[var(--color-border)]"
                style={{ background: "#6E2A82" }}
              />
              <span
                className="h-3 w-3 rounded-full ring-1 ring-[var(--color-border)]"
                style={{ background: "#FF6BAA" }}
              />
              <span
                className="h-3 w-3 rounded-full ring-1 ring-[var(--color-border)]"
                style={{ background: "#EFC3E4" }}
              />
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        data-testid="theme-toggle"
        data-theme-state={theme}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-glow-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      {/* Conic iridescent ring — only paints in the two violet states.
          Sits just inside the border and slowly rotates, giving the
          switcher a premium "lit" feel when the user is in a violet
          mood. Hidden in light/dark to keep the default toggle calm. */}
      <span
        aria-hidden
        suppressHydrationWarning
        className={`pointer-events-none absolute inset-[2px] rounded-full transition-opacity duration-500 ease-[var(--ease-standard)] motion-safe:animate-[border-flow_9s_linear_infinite] ${
          isViolet ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            theme === "desire"
              ? "conic-gradient(from 0deg, rgba(239,195,228,0) 0deg, rgba(239,195,228,0.65) 80deg, rgba(255,107,170,0.5) 160deg, rgba(239,199,133,0.55) 240deg, rgba(239,195,228,0) 360deg)"
              : "conic-gradient(from 0deg, rgba(110,42,130,0) 0deg, rgba(110,42,130,0.45) 80deg, rgba(209,65,134,0.4) 160deg, rgba(217,146,94,0.45) 240deg, rgba(110,42,130,0) 360deg)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Sun — visible in `light` state. */}
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          theme === "light"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        }`}
      >
        <Sun className="h-4 w-4" aria-hidden />
      </span>

      {/* Moon — visible in `dark` state. */}
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center text-[var(--color-brand-primary)] transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          theme === "dark"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        }`}
      >
        <Moon className="h-4 w-4" aria-hidden />
      </span>

      {/* Sparkles — visible in `bloom` state. Renders in deep mauve so
          it telegraphs the royal-violet primary it'll switch INTO on
          the next click. */}
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          theme === "bloom"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-45 scale-50"
        }`}
        style={{ color: ACCENT.bloom }}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>

      {/* Flame — visible in `desire` state. Renders in iridescent rose-
          mauve so it telegraphs the dark-violet mood. */}
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          theme === "desire"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-180 scale-50"
        }`}
        style={{ color: ACCENT.desire }}
      >
        <Flame className="h-4 w-4" aria-hidden />
      </span>

      {/* Soft glow halo behind the icon — tinted with the OUTGOING
          accent so the button itself signals the mood the user just
          chose. Only the two violet states light this up. */}
      <span
        aria-hidden
        suppressHydrationWarning
        className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500 ease-[var(--ease-standard)] ${
          isViolet ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(closest-side, ${HALO[theme]}, transparent 78%)`,
        }}
      />

      {/* Tiny accent dot in the bottom-right corner — a 4px chip in the
          NEXT theme's primary color so users get a one-glance preview
          of what clicking will do. Always visible; crossfades on cycle. */}
      <span
        aria-hidden
        suppressHydrationWarning
        className="pointer-events-none absolute bottom-[6px] right-[6px] h-1.5 w-1.5 rounded-full ring-1 ring-[var(--color-surface)] transition-colors duration-300 ease-[var(--ease-standard)]"
        style={{
          background: ACCENT[NEXT_THEME[theme]],
          boxShadow: isViolet
            ? `0 0 6px ${ACCENT[NEXT_THEME[theme]]}`
            : "none",
        }}
      />
      </button>
    </span>
  );
}
