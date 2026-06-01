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
 * Ten valid themes. Light: `amour` (default — passion red), `light`,
 * `bloom` (violet), `aurora` (sky blue), `jade` (mint), `lavender`. Dark:
 * `dark`, `desire` (violet), `ember` (passion red), `noir` (sapphire).
 * First visit always lands on `amour` regardless of OS color scheme.
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
const SCRIPT = `(function(){try{var ok={light:1,dark:1,desire:1,bloom:1,ember:1,amour:1,noir:1,aurora:1,jade:1,lavender:1};var current=document.documentElement.getAttribute('data-theme');if(current&&ok[current])return;var s=localStorage.getItem('biringas:theme');var t=ok[s]?s:'amour';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript() {
  return (
    // The `no-before-interactive-script-outside-document` rule is a Pages-
    // Router-era check that expects `beforeInteractive` only in
    // `pages/_document.js`. In App Router the equivalent placement is the
    // root layout, which is this very file's caller (`app/[lang]/layout.tsx`,
    // the only layout in the tree — there is no `app/layout.tsx`). The
    // strategy IS the right one here for the reasons documented above; the
    // plugin just doesn't recognize App Router.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="theme-pre-paint"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
