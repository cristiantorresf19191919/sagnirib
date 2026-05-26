import "server-only";

/**
 * Domain types for the `users/{uid}` port (ADR-019).
 *
 * `users/{uid}.accountType` is the SOLE AUTHORITATIVE source for the
 * publisher-vs-commentator distinction. Cookie + custom claims are
 * derived from this — never the other way around. Write-once: once a
 * user has an `accountType`, no Server Action will overwrite it.
 *
 * To switch journeys, the user must create a separate account with a
 * different email. There is intentionally no self-service "change
 * account type" flow (see ADR-019 § "Out of scope").
 */

export type AccountType = "publisher" | "commentator";

export const ACCOUNT_TYPE_PUBLISHER = "publisher" as const;
export const ACCOUNT_TYPE_COMMENTATOR = "commentator" as const;

/**
 * Marker for *why* the lock happened. Surfaces in the audit log so
 * trust&safety can tell a deliberate chooser pick from an auto-derived
 * decision (the lazy-migration path is the one most likely to mis-bucket
 * an edge-case legacy account).
 */
export type AccountTypeChosenVia =
  /** Visitor picked on `/ingresar` or `/registrarse` before any session existed. */
  | "pre-oauth"
  /** Returning user picked in the post-OAuth fallback modal. */
  | "post-oauth-modal"
  /** Derived from legacy signals (drafts / reviews / claims / cookie) on first read after deploy. */
  | "lazy-migration";

export interface UserRecord {
  uid: string;
  accountType: AccountType;
  /** Snapshot at lock time. Not the source of truth for current email. */
  email: string | null;
  /** ISO. When `accountType` was first written. */
  accountTypeChosenAt: string;
  /** Same as `accountTypeChosenAt` today; kept distinct for future fields. */
  createdAt: string;
  accountTypeChosenVia: AccountTypeChosenVia;
}

export interface SetAccountTypeOnceInput {
  accountType: AccountType;
  via: AccountTypeChosenVia;
}

/**
 * Discriminated union returned by `setAccountTypeOnce` so callers can
 * branch on the outcome without parsing message strings.
 *
 *   - `ok: true,  locked: true`  — first write; the doc was just created.
 *   - `ok: true,  locked: false` — doc already had the SAME accountType.
 *                                  Idempotent no-op (no audit fires).
 *   - `ok: false, error.kind = 'account-type-locked'` — doc had the
 *                                  OPPOSITE accountType. The mutation is
 *                                  refused; audit event
 *                                  `auth.account_type_lock_attempt_blocked`
 *                                  fires.
 */
export type SetAccountTypeOnceResult =
  | { ok: true; locked: boolean; accountType: AccountType }
  | {
      ok: false;
      error: {
        kind: "account-type-locked";
        currentAccountType: AccountType;
      };
    };
