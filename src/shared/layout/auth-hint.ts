/**
 * Non-sensitive auth hint cookie.
 *
 * Set to "1" alongside the httpOnly `__session` cookie on login and removed
 * on logout (see `manage-session.ts`). It carries NO identity — just a
 * readable boolean so instant UI surfaces (route loading fallbacks) can tell
 * "logged-in vs anonymous" without reading the httpOnly session or verifying
 * a token. Never trust it for authorization — it's a presentation hint only;
 * every real gate still goes through `getSession()` / `requireAuth()`.
 */
export const AUTH_HINT_COOKIE = "bg_auth";
