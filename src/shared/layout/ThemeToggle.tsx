"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Aperture,
  Cherry,
  Droplet,
  Flame,
  Flower,
  Flower2,
  Gem,
  Heart,
  Leaf,
  Moon,
  MoonStar,
  Sparkle,
  Sparkles,
  Sun,
  Sunrise,
} from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

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
 * Apply the theme to <html> + persist it + notify subscribers.
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

type StartViewTransition = (cb: () => void) => { ready: Promise<void> };

/**
 * Recolor the whole UI with a circular wipe that grows from the picked swatch
 * — the "radial" theme reveal. Implemented with the View Transitions API: the
 * old frame is snapshotted, the callback flushes the theme + closes the modal
 * synchronously (so the new snapshot is already recolored and modal-free), then
 * we animate a `circle()` clip on the new snapshot outward from (x, y).
 * Browsers without the API (or reduced-motion users) get an instant, clean
 * swap via the `fallback` callback.
 */
function applyThemeWithReveal(
  next: Theme,
  x: number,
  y: number,
  reduce: boolean,
  commit: () => void,
) {
  const startVT = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  if (reduce || typeof startVT !== "function") {
    commit();
    return;
  }
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const vt = startVT.call(document, () => {
    flushSync(commit);
  });
  vt.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* transition skipped/interrupted — theme already applied */
    });
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
  return DEFAULT_THEME;
}

const THEME_NAME: Record<Theme, string> = {
  light: "Claro",
  amour: "Amour",
  scarlet: "Escarlata",
  rose: "Rosa",
  bloom: "Bloom",
  lavender: "Lavanda",
  aurora: "Aurora",
  jade: "Jade",
  dark: "Oscuro",
  ember: "Ember",
  crimson: "Carmesí",
  fuchsia: "Fucsia",
  desire: "Deseo",
  noir: "Noir",
  onyx: "Onyx",
};

/** Short mood descriptor shown under the active name in the hub. */
const THEME_TAGLINE: Record<Theme, string> = {
  light: "Crema editorial",
  amour: "Rojo pasión",
  scarlet: "Escarlata intenso",
  rose: "Magenta floral",
  bloom: "Violeta en flor",
  lavender: "Lavanda suave",
  aurora: "Azul amanecer",
  jade: "Verde jade",
  dark: "Bosque nocturno",
  ember: "Brasa sensual",
  crimson: "Carmesí ardiente",
  fuchsia: "Fucsia neón",
  desire: "Violeta medianoche",
  noir: "Zafiro de medianoche",
  onyx: "Negro · gris con luz",
};

const LIGHT_THEMES: ReadonlyArray<Theme> = [
  "light",
  "amour",
  "scarlet",
  "rose",
  "bloom",
  "lavender",
  "aurora",
  "jade",
];
const DARK_THEMES_ORDER: ReadonlyArray<Theme> = [
  "dark",
  "ember",
  "crimson",
  "fuchsia",
  "desire",
  "noir",
  "onyx",
];
const THEMES: ReadonlyArray<Theme> = [...LIGHT_THEMES, ...DARK_THEMES_ORDER];

/** Signature swatch color per theme. */
const ACCENT: Record<Theme, string> = {
  light: "#2F5D43",
  amour: "#9A1F35",
  scarlet: "#D11A2A",
  rose: "#C81E6B",
  bloom: "#6E2A82",
  lavender: "#5B3FB0",
  aurora: "#1F5C9E",
  jade: "#0F7A63",
  dark: "#88BDA1",
  ember: "#F4828B",
  crimson: "#FF4D5E",
  fuchsia: "#FF5FB0",
  desire: "#EFC3E4",
  noir: "#8FB3FF",
  onyx: "#F5F5F7",
};

/** A representative background per swatch so each dot previews its surface. */
const SWATCH_BG: Record<Theme, string> = {
  light: "#F4EFE3",
  amour: "#FBF1F0",
  scarlet: "#FFF1F0",
  rose: "#FBEFF5",
  bloom: "#F8EFF7",
  lavender: "#F1EEFB",
  aurora: "#EEF4FB",
  jade: "#EAF6F2",
  dark: "#14130E",
  ember: "#150307",
  crimson: "#180206",
  fuchsia: "#1A0518",
  desire: "#120320",
  noir: "#060B1B",
  onyx: "#0A0A0B",
};

const HALO: Record<Theme, string> = {
  light: "rgba(47,93,67,0)",
  amour: "rgba(154,31,53,0.30)",
  scarlet: "rgba(209,26,42,0.34)",
  rose: "rgba(200,30,107,0.34)",
  bloom: "rgba(110,42,130,0.32)",
  lavender: "rgba(91,63,176,0.30)",
  aurora: "rgba(31,92,158,0.30)",
  jade: "rgba(15,122,99,0.30)",
  dark: "rgba(136,189,161,0)",
  ember: "rgba(244,130,139,0.40)",
  crimson: "rgba(255,77,94,0.42)",
  fuchsia: "rgba(255,95,176,0.42)",
  desire: "rgba(239,195,228,0.42)",
  noir: "rgba(143,179,255,0.38)",
  onyx: "rgba(245,245,247,0.30)",
};

const ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  amour: Cherry,
  scarlet: Gem,
  rose: Flower,
  bloom: Sparkles,
  lavender: Flower2,
  aurora: Sunrise,
  jade: Leaf,
  dark: Moon,
  ember: Heart,
  crimson: Droplet,
  fuchsia: Sparkle,
  desire: Flame,
  noir: MoonStar,
  onyx: Aperture,
};

const SPRING = { type: "spring", stiffness: 320, damping: 26, mass: 0.6 } as const;

// Wheel geometry. Two concentric rings: light moods outside, dark inside.
// Sized to fit a ~320 px mobile drawer once dialog padding is added.
const WHEEL = 288; // px box
const CENTER = WHEEL / 2;
const RING_LIGHT = 116;
const RING_DARK = 70;
const DOT = 38;

interface Placed {
  theme: Theme;
  x: number; // center coords within the wheel box
  y: number;
}

function placeRing(themes: ReadonlyArray<Theme>, radius: number): Placed[] {
  const n = themes.length;
  return themes.map((theme, i) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return {
      theme,
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    };
  });
}

const PLACED: Placed[] = [
  ...placeRing(LIGHT_THEMES, RING_LIGHT),
  ...placeRing(DARK_THEMES_ORDER, RING_DARK),
];

/**
 * Header-mounted theme picker — a radial "mood wheel".
 *
 * The trigger shows the current theme's icon + halo. Opening it lifts a glassy
 * dialog with every mood arranged on two rings (light moods outside, dark
 * inside) that fan out from the centre with a staggered spring. The centre hub
 * previews the focused/active mood. Picking a swatch fires a circular View-
 * Transition wipe that recolors the whole site outward from the swatch.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Theme | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const dialogId = useId();

  const isColored = theme !== "light" && theme !== "dark";
  const hub = preview ?? theme;

  // Focus the active swatch when the wheel opens (ARIA menu pattern).
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const items = dialogRef.current.querySelectorAll<HTMLButtonElement>(
      '[role="menuitemradio"]',
    );
    const idx = THEMES.indexOf(theme);
    (items[idx] ?? items[0])?.focus();
  }, [open, theme]);

  // Outside-click + Escape + arrow navigation around the wheel.
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (dialogRef.current?.contains(target) || triggerRef.current?.contains(target))
        return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (!dialogRef.current) return;
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLButtonElement>(
          '[role="menuitemradio"]',
        ),
      );
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);
      if (idx < 0) return;
      let nextIdx = idx;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIdx = (idx + 1) % items.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIdx = (idx - 1 + items.length) % items.length;
      else if (event.key === "Home") nextIdx = 0;
      else if (event.key === "End") nextIdx = items.length - 1;
      else return;
      event.preventDefault();
      items[nextIdx]?.focus();
      setPreview(THEMES[nextIdx] ?? null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function pick(next: Theme, el: HTMLElement | null) {
    const rect = el?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    applyThemeWithReveal(next, x, y, !!reduceMotion, () => {
      applyTheme(next);
      setOpen(false);
    });
    setPreview(null);
    triggerRef.current?.focus();
  }

  const HubIcon = ICON[hub];

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="theme-toggle"
        data-theme-state={theme}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={`Tema: ${THEME_NAME[theme]}`}
        title={`Tema: ${THEME_NAME[theme]}`}
        className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition-[border-color,background,transform,box-shadow] duration-200 ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)] hover:shadow-[var(--shadow-glow-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        {THEMES.map((t) => {
          const Icon = ICON[t];
          const isActive = theme === t;
          const colorStyle: React.CSSProperties =
            t === "dark" || t === "light" ? {} : { color: ACCENT[t] };
          return (
            <span
              key={t}
              suppressHydrationWarning
              className={`absolute inline-flex h-4 w-4 items-center justify-center transition-[opacity,transform] duration-300 ease-[var(--ease-standard)] ${
                t === "dark" ? "text-[var(--color-brand-primary)]" : ""
              } ${isActive ? "rotate-0 scale-100 opacity-100" : "scale-50 opacity-0"}`}
              style={colorStyle}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          );
        })}
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
          <>
            {/* Backdrop — inline position so it reliably covers regardless of
                utility-layer resolution. */}
            <motion.div
              aria-hidden
              className="bg-[var(--color-background)]/55 backdrop-blur-[3px]"
              style={{ position: "fixed", inset: 0, zIndex: 60 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Centered mood-wheel dialog. Centering is done via framer's own
                x/y (-50%) so it never fights the entrance scale transform, and
                position is inline-fixed for reliability. */}
            <motion.div
              ref={dialogRef}
              id={dialogId}
              role="menu"
              aria-label="Seleccionar tema"
              style={{ position: "fixed", left: "50%", top: "50%", zIndex: 61 }}
              initial={
                reduceMotion
                  ? { opacity: 0, x: "-50%", y: "-50%" }
                  : { opacity: 0, scale: 0.92, x: "-50%", y: "-50%" }
              }
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={
                reduceMotion
                  ? { opacity: 0, x: "-50%", y: "-50%" }
                  : { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }
              }
              transition={reduceMotion ? { duration: 0.14 } : SPRING}
              className="flex max-w-[calc(100vw-1.5rem)] flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-md sm:p-6"
            >
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
                  Elige tu ambiente
                </span>
              </div>

              {/* The wheel */}
              <div
                className="relative"
                style={{ width: WHEEL, height: WHEEL }}
                onMouseLeave={() => setPreview(null)}
              >
                {/* Faint dual-ring guide tracks */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-full border border-[var(--color-border)]/60"
                  style={{
                    width: RING_LIGHT * 2,
                    height: RING_LIGHT * 2,
                    left: CENTER - RING_LIGHT,
                    top: CENTER - RING_LIGHT,
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-full border border-dashed border-[var(--color-border)]/50"
                  style={{
                    width: RING_DARK * 2,
                    height: RING_DARK * 2,
                    left: CENTER - RING_DARK,
                    top: CENTER - RING_DARK,
                  }}
                />

                {/* Center hub — previews focused/active mood */}
                <motion.div
                  className="absolute flex flex-col items-center justify-center gap-1 rounded-full"
                  style={{
                    width: 104,
                    height: 104,
                    left: CENTER - 52,
                    top: CENTER - 52,
                  }}
                  initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.05 }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(closest-side, ${ACCENT[hub]}33, transparent 80%)`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--color-border)]"
                    style={{ background: SWATCH_BG[hub], color: ACCENT[hub] }}
                  >
                    <HubIcon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="relative text-[13px] font-bold leading-none text-[var(--color-foreground)]">
                    {THEME_NAME[hub]}
                  </span>
                  <span className="relative px-2 text-center text-[9px] leading-tight text-[var(--color-text-subtle)]">
                    {THEME_TAGLINE[hub]}
                  </span>
                </motion.div>

                {/* Swatch dots */}
                {PLACED.map(({ theme: t, x, y }, i) => {
                  const Icon = ICON[t];
                  const isActive = theme === t;
                  const dx = x - CENTER;
                  const dy = y - CENTER;
                  return (
                    <motion.button
                      key={t}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      aria-label={`${THEME_NAME[t]} — ${THEME_TAGLINE[t]}`}
                      title={THEME_NAME[t]}
                      onClick={(e) => pick(t, e.currentTarget)}
                      onMouseEnter={() => setPreview(t)}
                      onFocus={() => setPreview(t)}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, scale: 0, x: -dx * 0.65, y: -dy * 0.65 }
                      }
                      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { ...SPRING, delay: 0.06 + i * 0.022 }
                      }
                      whileHover={reduceMotion ? undefined : { scale: 1.18 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                      className="absolute inline-flex items-center justify-center rounded-full ring-1 transition-[box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                      style={{
                        width: DOT,
                        height: DOT,
                        left: x - DOT / 2,
                        top: y - DOT / 2,
                        background: SWATCH_BG[t],
                        color: ACCENT[t],
                        boxShadow: isActive
                          ? `0 0 0 2px ${ACCENT[t]}, 0 6px 16px -6px ${ACCENT[t]}`
                          : undefined,
                        // ring color via inline so each swatch keeps its hue
                        ["--tw-ring-color" as string]: isActive
                          ? ACCENT[t]
                          : "var(--color-border)",
                      }}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </motion.button>
                  );
                })}
              </div>

              <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-[var(--color-text-subtle)]">
                Anillo exterior: tonos claros · anillo interior: tonos oscuros.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
