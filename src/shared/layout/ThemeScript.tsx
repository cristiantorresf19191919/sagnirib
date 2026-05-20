/**
 * Inline `<script>` that sets `data-theme` on <html> BEFORE first paint
 * so themed users never see a cream flash. Reads localStorage first;
 * falls back to the `prefers-color-scheme` media query.
 *
 * Seven valid themes: `light` (default), `dark`, `desire` (dark violet),
 * `bloom` (light violet), `ember` (dark passion red), `amour` (light
 * passion red), `noir` (dark sapphire).
 *
 * Runs synchronously in <head>, so it must be tiny and self-contained
 * (no imports, no React). React renders it as a server component via
 * `dangerouslySetInnerHTML` — the body is a fixed string we own.
 */
const SCRIPT = `(function(){try{var s=localStorage.getItem('biringas:theme');var ok={light:1,dark:1,desire:1,bloom:1,ember:1,amour:1,noir:1};var t=ok[s]?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
