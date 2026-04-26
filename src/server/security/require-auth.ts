import "server-only";

export interface AuthenticatedUser {
  id: string;
  roles: ReadonlyArray<string>;
}

/**
 * Enforces authentication for Server Actions and Server Components.
 *
 * No auth provider is wired yet — this stub fails closed so any caller
 * triggers an explicit decision. Wiring the real provider must happen
 * in a single place (here) per Addendum 001 §14.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  throw new Error(
    "[security] requireAuth is not wired yet. Configure an auth provider before invoking protected server code.",
  );
}
