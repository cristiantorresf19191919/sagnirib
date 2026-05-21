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
 * Runs synchronously in <head>, so it must be tiny and self-contained
 * (no imports, no React). React renders it as a server component via
 * `dangerouslySetInnerHTML` — the body is a fixed string we own.
 */
const SCRIPT = `(function(){try{var ok={light:1,dark:1,desire:1,bloom:1,ember:1,amour:1,noir:1};var current=document.documentElement.getAttribute('data-theme');if(current&&ok[current])return;var s=localStorage.getItem('biringas:theme');var t=ok[s]?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
