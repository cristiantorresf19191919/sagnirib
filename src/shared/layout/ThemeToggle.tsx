"use client";

import { Flame, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "biringas:theme";

type Theme = "light" | "dark" | "desire";

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
  if (attr === "desire") return "desire";
  return "light";
}

function getServerSnapshot(): Theme {
  // SSR default — `ThemeScript` overrides via pre-paint inline script
  // before this component renders on the client.
  return "light";
}

/** Cycle: light → dark → desire → light. */
const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "desire",
  desire: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Cambiar a tema oscuro",
  dark: "Cambiar a tema deseo",
  desire: "Cambiar a tema claro",
};

/**
 * Header-mounted theme toggle. Three moods on a cycle:
 *  - `light` → cream paper + forest CTAs.
 *  - `dark`  → candlelit ink + mint CTAs.
 *  - `desire` → deep aubergine + mauve CTAs + rose-gold accents.
 *
 * Three icons stacked (sun, moon, flame) crossfade + rotate + scale as
 * the cycle progresses. Uses `useSyncExternalStore` to read the canonical
 * theme directly from the DOM — no `useEffect` sync, no cascade renders.
 * `suppressHydrationWarning` on the icons because the post-paint theme
 * can legitimately differ from the server default once `ThemeScript`
 * has run.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = () => applyTheme(NEXT_THEME[theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      data-theme-state={theme}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-glow-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
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
      {/* Flame — visible in `desire` state. Renders in mauve so it
          telegraphs the violet/pink theme it'll switch INTO on the next
          click. */}
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          theme === "desire"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-180 scale-50"
        }`}
        style={{ color: "#E5B7DA" }}
      >
        <Flame className="h-4 w-4" aria-hidden />
      </span>
      {/* A soft glow halo behind the icon when in desire mode — picks
          up on the rose-gold accent so the button itself signals the
          mood the user just chose. */}
      <span
        aria-hidden
        suppressHydrationWarning
        className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500 ease-[var(--ease-standard)] ${
          theme === "desire" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(closest-side, rgba(229,183,218,0.35), rgba(229,183,218,0) 75%)",
        }}
      />
    </button>
  );
}
