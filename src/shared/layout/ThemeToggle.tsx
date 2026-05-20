"use client";

import {
  Cherry,
  Flame,
  Heart,
  Moon,
  MoonStar,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "biringas:theme";
const HINT_DISMISSED_KEY = "biringas:theme-hint-dismissed";

type Theme =
  | "light"
  | "dark"
  | "desire"
  | "bloom"
  | "ember"
  | "amour"
  | "noir";

const VALID_THEMES: ReadonlySet<Theme> = new Set([
  "light",
  "dark",
  "desire",
  "bloom",
  "ember",
  "amour",
  "noir",
]);

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
  if (attr && VALID_THEMES.has(attr as Theme)) return attr as Theme;
  return "light";
}

function getServerSnapshot(): Theme {
  // SSR default — `ThemeScript` overrides via pre-paint inline script
  // before this component renders on the client.
  return "light";
}

/**
 * Cycle:
 *   light → dark
 *        → desire (dark violet)
 *        → bloom  (light violet)
 *        → ember  (dark passion red)
 *        → amour  (light passion rose)
 *        → noir   (dark sapphire)
 *        → light
 *
 * Order is deliberate: each step is a clear vibe shift, dark/light
 * alternates inside each color family, and the visit order roughly
 * matches editorial gravity (familiar → adventurous → sophisticated).
 */
const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "desire",
  desire: "bloom",
  bloom: "ember",
  ember: "amour",
  amour: "noir",
  noir: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Cambiar a tema oscuro",
  dark: "Cambiar a tema violeta oscuro",
  desire: "Cambiar a tema violeta claro",
  bloom: "Cambiar a tema pasión oscuro",
  ember: "Cambiar a tema pasión claro",
  amour: "Cambiar a tema zafiro",
  noir: "Cambiar a tema claro",
};

/**
 * Visual signature per theme — the small chip/halo color that
 * telegraphs what the toggle will switch INTO on the next click.
 * Used by the corner-dot preview, halo, and (where applicable) the
 * conic iridescent ring.
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
 *  colored themes. Each one is a different chord of its palette so the
 *  toggle reads as a tiny preview of the active mood. `null` means no
 *  ring (light + dark stay calm). */
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

/**
 * Header-mounted theme toggle. Seven moods on a cycle.
 *
 * The button always shows the icon + accent dot of the CURRENT theme so
 * the toggle is also a status indicator. The corner preview dot shows
 * the NEXT theme's primary so users get a one-glance preview of what
 * clicking will do.
 *
 * Implementation notes:
 *  - `useSyncExternalStore` reads the canonical theme directly from the
 *    DOM — no `useEffect` sync, no cascade renders.
 *  - `suppressHydrationWarning` on the icons + halo because the post-
 *    paint theme can legitimately differ from the server default once
 *    `ThemeScript` has run.
 *  - First-time hint: on the second click (when the user lands in
 *    `dark`), a small popover offers a preview of the violet+passion
 *    moods so users discover them without having to cycle blindly.
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

  // "Colored" themes get the halo + conic ring; plain light/dark stay
  // visually quiet so the toggle doesn't compete with the rest of the
  // header chrome at rest.
  const isColored = theme !== "light" && theme !== "dark";

  // First-time hint shown once the user has reached `dark` — surfaces
  // the colored mood palette they may never otherwise discover.
  const [hintVisible, setHintVisible] = useState(false);
  useEffect(() => {
    if (theme !== "dark") return;
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(HINT_DISMISSED_KEY) === "1") return;
    } catch {
      return;
    }
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

  const ring = RING[theme];

  return (
    <span className="relative inline-flex">
      {hintVisible && (
        <div
          data-testid="theme-hint"
          role="status"
          aria-live="polite"
          className="motion-safe:motion-hero-reveal absolute right-0 top-12 z-50 w-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-md)]"
        >
          <span
            aria-hidden
            className="absolute -top-1.5 right-[14px] h-3 w-3 rotate-45 border-l border-t border-[var(--color-border)] bg-[var(--color-surface)]"
          />
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
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-foreground)]">
            Toca otra vez y vas a recorrer{" "}
            <span className="font-semibold" style={{ color: "#E5B7DA" }}>
              violeta
            </span>
            ,{" "}
            <span className="font-semibold" style={{ color: ACCENT.ember }}>
              pasión
            </span>{" "}
            y{" "}
            <span className="font-semibold" style={{ color: ACCENT.noir }}>
              zafiro
            </span>
            .
          </p>
          {/* Palette preview — 5 swatches, one per colored mood, in the
              cycle order. Reads as a horizontal gradient of available
              vibes. */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Vista previa
            </span>
            <span aria-hidden className="inline-flex items-center gap-1.5">
              {(["desire", "bloom", "ember", "amour", "noir"] as Theme[]).map(
                (t) => (
                  <span
                    key={t}
                    title={t}
                    className="h-3 w-3 rounded-full ring-1 ring-[var(--color-border)]"
                    style={{ background: ACCENT[t] }}
                  />
                ),
              )}
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
            in each cycle step (less mechanical than a single keyframe). */}
        {(Object.keys(ICON) as Theme[]).map((t) => {
          const Icon = ICON[t];
          const isActive = theme === t;
          // Rotation direction differs per theme for variety.
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
            t === "dark"
              ? {}
              : t === "light"
                ? {}
                : { color: ACCENT[t] };
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
            accent so the button itself signals the mood the user just
            chose. Only the colored themes light this up. */}
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

        {/* Corner dot — 4 px chip in the NEXT theme's primary color so
            users get a one-glance preview of what clicking will do. */}
        <span
          aria-hidden
          suppressHydrationWarning
          className="pointer-events-none absolute bottom-[6px] right-[6px] h-1.5 w-1.5 rounded-full ring-1 ring-[var(--color-surface)] transition-colors duration-300 ease-[var(--ease-standard)]"
          style={{
            background: ACCENT[NEXT_THEME[theme]],
            boxShadow: isColored
              ? `0 0 6px ${ACCENT[NEXT_THEME[theme]]}`
              : "none",
          }}
        />
      </button>
    </span>
  );
}
