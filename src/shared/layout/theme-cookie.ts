/**
 * Theme persistence — shared constants for the cookie + `data-theme`
 * attribute that drive the brand's seven-mood palette.
 *
 * The active theme lives in three places, in this order of priority:
 *
 *   1. `data-theme` attribute on `<html>` — what the CSS actually reads.
 *      The Server Component layout SSR-emits this from the cookie so a
 *      `router.refresh()` (e.g. after the locale switcher) cannot strip
 *      it during reconciliation, which is the regression this file was
 *      created to fix.
 *   2. `biringas:theme` cookie — what the server reads on every request.
 *      Written by `ThemeToggle` alongside localStorage so the next SSR
 *      pass already knows the user's choice.
 *   3. `biringas:theme` localStorage — pre-paint hint read by
 *      `ThemeScript` for the very first visit (no cookie yet).
 *
 * Keeping all three in sync is the toggle's job. Reads are cheap: SSR
 * goes straight to cookie, client goes straight to the DOM attribute.
 */
export const THEME_COOKIE = "biringas:theme";

export type Theme =
  // Light moods
  | "light"
  | "amour"
  | "scarlet"
  | "rose"
  | "bloom"
  | "lavender"
  | "aurora"
  | "jade"
  // Dark moods
  | "dark"
  | "ember"
  | "crimson"
  | "fuchsia"
  | "desire"
  | "noir"
  | "onyx";

export const VALID_THEMES: ReadonlySet<Theme> = new Set([
  "light",
  "amour",
  "scarlet",
  "rose",
  "bloom",
  "lavender",
  "aurora",
  "jade",
  "dark",
  "ember",
  "crimson",
  "fuchsia",
  "desire",
  "noir",
  "onyx",
]);

export const DEFAULT_THEME: Theme = "amour";

export function isValidTheme(value: string | undefined | null): value is Theme {
  return !!value && VALID_THEMES.has(value as Theme);
}
