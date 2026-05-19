"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "biringas:theme";

type Theme = "light" | "dark";

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
  return attr === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  // SSR default — `ThemeScript` overrides via pre-paint inline script
  // before this component renders on the client.
  return "light";
}

/**
 * Header-mounted theme toggle. Swaps `data-theme` on <html>, persists
 * the choice to localStorage, and respects the user's OS preference for
 * the initial value on first paint (handled by ThemeScript so there is
 * no flash).
 *
 * Uses `useSyncExternalStore` so the component reads the canonical theme
 * directly from the DOM — no `useEffect` sync, no cascade renders. The
 * sun/moon icons are stacked and crossfaded; `suppressHydrationWarning`
 * is added to the icons because the post-paint theme can legitimately
 * differ from the server's "light" default once the script has run.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isDark = theme === "dark";

  const toggle = () => applyTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-pressed={isDark}
      className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-[border-color,background,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          isDark
            ? "opacity-0 rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        }`}
      >
        <Sun className="h-4 w-4" aria-hidden />
      </span>
      <span
        suppressHydrationWarning
        className={`absolute inline-flex h-4 w-4 items-center justify-center text-[var(--color-brand-primary)] transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50"
        }`}
      >
        <Moon className="h-4 w-4" aria-hidden />
      </span>
    </button>
  );
}
