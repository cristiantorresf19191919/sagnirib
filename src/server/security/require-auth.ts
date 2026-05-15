import "server-only";

import { AuthError, getSession } from "@/server/auth";
import type { AuthenticatedUser } from "@/server/auth/types";

export type { AuthenticatedUser } from "@/server/auth/types";

/**
 * Enforces authentication for Server Actions and Server Components.
 *
 * Returns the authenticated user, or throws `AuthError("no-session")` if
 * the request is anonymous. Call sites that want optional auth (`null` is
 * fine) should use `getSession()` from `@/server/auth` directly.
 *
 * This is the SINGLE place where the auth provider is consulted for guard
 * purposes (Addendum 001 §14). Adding a new check (e.g. emailVerified) goes
 * here, not in features.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getSession();
  if (!user) {
    throw new AuthError("no-session", "Authentication required");
  }
  return user;
}
