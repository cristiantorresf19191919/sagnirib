import Script from "next/script";

/**
 * Inline `<script>` that sets `data-theme` on <html> BEFORE first paint
 * so themed users never see a cream flash.
 *
 * Source of truth precedence (highest → lowest):
 *   1. The `data-theme` attribute already on `<html>` — the Server
 *      Component layout SSR-emits it from the cookie, so on a returning
 *      visit this is already correct and the script no-ops.
 *   2. `localStorage` — covers a first visit on a fresh device where the
 *      server had no cookie to read yet (e.g. before the first toggle
 *      click writes one).
 *   3. `prefers-color-scheme` media query — last-resort signal.
 *
 * Seven valid themes: `light` (default), `dark`, `desire` (dark violet),
 * `bloom` (light violet), `ember` (dark passion red), `amour` (light
 * passion red), `noir` (dark sapphire).
 *
 * Wrapped in `next/script` with `strategy="beforeInteractive"` so Next
 * hoists it into `<head>` *outside* the React reconciler. A raw
 * `<script dangerouslySetInnerHTML>` lives in React's tree, where a
 * browser extension injecting its own `<script src>` into `<head>` before
 * hydration would mutate the same DOM slot and trigger a hydration
 * mismatch cascade (React 19 also refuses to execute inline scripts on
 * client re-render). `beforeInteractive` sidesteps both: the script is
 * injected by Next directly, runs before hydration, and is never
 * re-rendered.
 */
const SCRIPT = `(function(){try{var ok={light:1,dark:1,desire:1,bloom:1,ember:1,amour:1,noir:1};var current=document.documentElement.getAttribute('data-theme');if(current&&ok[current])return;var s=localStorage.getItem('biringas:theme');var t=ok[s]?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript() {
  return (
    <Script
      id="theme-pre-paint"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
