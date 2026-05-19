/**
 * Inline `<script>` that sets `data-theme` on <html> BEFORE first paint
 * so dark-mode users never see a cream flash. Reads localStorage first;
 * falls back to the `prefers-color-scheme` media query.
 *
 * Runs synchronously in <head>, so it must be tiny and self-contained
 * (no imports, no React). React renders it as a server component via
 * `dangerouslySetInnerHTML` — the body is a fixed string that we own,
 * so no XSS surface.
 */
const SCRIPT = `(function(){try{var s=localStorage.getItem('biringas:theme');var t=s==='dark'||s==='light'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
