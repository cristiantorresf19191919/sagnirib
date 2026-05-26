import "server-only";

import { updateTag } from "next/cache";

import { isFirebaseConfigured } from "@/core/config/firebase";
import { revokeRole, Role } from "@/server/auth";
import type { AuthenticatedUser } from "@/server/auth/types";
import { auditLog } from "@/server/security/audit-log";
import { requireAuth } from "@/server/security/require-auth";
import { validateActionInput } from "@/server/security/validate-action-input";

import { setAccountTypeOnceSchema } from "./schemas";
import {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
} from "./types";
import type {
  AccountType,
  SetAccountTypeOnceInput,
  SetAccountTypeOnceResult,
} from "./types";

export type {
  AccountType,
  AccountTypeChosenVia,
  SetAccountTypeOnceInput,
  SetAccountTypeOnceResult,
  UserRecord,
} from "./types";
export {
  ACCOUNT_TYPE_COMMENTATOR,
  ACCOUNT_TYPE_PUBLISHER,
} from "./types";

/**
 * Public barrel for the users port (ADR-019).
 *
 * `users/{uid}.accountType` is the **sole authoritative source** for
 * the publisher-vs-commentator distinction. Cookie + custom claims are
 * derived from this — never the other way around.
 *
 * Write-once semantics: `setAccountTypeOnce` is idempotent on the same
 * type and rejects on the opposite type. There is intentionally no
 * `unlockAccountType` / `clearAccountType` action — to switch
 * journeys, a user creates a new account with a different email.
 *
 * Lazy migration: when `getMyAccountType()` runs for an account with
 * no `users/{uid}` doc, the barrel probes legacy signals (drafts,
 * claims, cookie) and persists the resolved type with
 * `via: 'lazy-migration'`. The probe lives in step 13 of the ADR-019
 * implementation plan; until then the function returns `null` for
 * undecided accounts and the UI surfaces the post-OAuth modal.
 */

const adapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/users")
  : await import("@/server/mocks/users");

/**
 * Drafts adapter — read-only access used ONLY by the lazy-migration
 * probe (ADR-019 § "Lazy migration"). The presence of a draft is the
 * strongest signal that a legacy account was a publisher; without
 * reading it we'd misclassify legacy accounts that have drafts but
 * never went through the new chooser.
 *
 * Imported directly from the adapter (not the barrel) because the
 * biringas barrel imports `requirePublisher` from this file —
 * importing the barrel would create a module-load cycle. The adapter
 * has no users-port dependency, so this direction is safe.
 */
const draftsAdapter = isFirebaseConfigured()
  ? await import("@/server/adapters/firebase/biringas")
  : await import("@/server/mocks/biringas");

const CACHE_TAGS = {
  user(uid: string): string {
    return `biringa:user:${uid}`;
  },
} as const;

export { CACHE_TAGS as USERS_CACHE_TAGS };

// ----------------------------------------------------------------------------
// Reads
// ----------------------------------------------------------------------------

/**
 * Returns the authenticated caller's account type, or `null` when the
 * lock has not yet happened. A `null` result means the UI should
 * surface the post-OAuth `AccountTypeFallbackModal`.
 *
 * Canonical source for every "can this user publish?" decision —
 * page-level redirects, mutation gates, and UI hiding all funnel
 * through here.
 *
 * Side effect: if no `users/{uid}` doc exists, run the lazy migration
 * probe (ADR-019 § "Lazy migration"). The probe inspects legacy
 * signals (drafts, claims, cookie) and, if any apply, writes the doc
 * with `via: 'lazy-migration'`. Subsequent calls short-circuit on the
 * doc.
 */
export async function getMyAccountType(): Promise<AccountType | null> {
  const user = await requireAuth();
  const record = await adapter.getUserRaw(user.uid);
  if (record) return record.accountType;
  return lazyMigrateAccountType(user);
}

/**
 * Convenience predicate. Equivalent to `getMyAccountType() !== null`
 * but avoids forcing the caller to discriminate `'publisher' | 'commentator'`
 * when all it needs to know is "is the choice already made?".
 */
export async function isAccountLocked(): Promise<boolean> {
  const user = await requireAuth();
  return (await adapter.getUserRaw(user.uid)) !== null;
}

/**
 * Gate helper: throws an error with `kind === 'forbidden'` if the
 * caller is not a publisher (commentator OR undecided). Used by
 * publisher-only mutations such as `createListingDraft`.
 *
 * The thrown error carries `currentAccountType` on the error object so
 * Server Action wrappers can return a structured `ActionResult` to
 * the client without re-querying.
 */
export async function requirePublisher(): Promise<{
  uid: string;
  accountType: "publisher";
}> {
  const user = await requireAuth();
  const accountType = await getMyAccountType();
  if (accountType !== "publisher") {
    const err = new Error(
      accountType === "commentator"
        ? "Esta acción es solo para cuentas Partner. Tu cuenta está registrada como cliente; para publicar perfiles, creá una cuenta nueva con otro correo."
        : "Necesitás elegir un tipo de cuenta antes de continuar.",
    );
    (err as { kind?: string }).kind = "forbidden";
    (err as { currentAccountType?: AccountType | null }).currentAccountType =
      accountType;
    throw err;
  }
  return { uid: user.uid, accountType };
}

/**
 * Symmetric gate to `requirePublisher`. Most commentator-only surfaces
 * handle the inverse via UI hiding rather than throws, so this is
 * used sparingly — primarily for the few commentator-side mutations
 * that should refuse publisher callers (e.g. commentator-only profile
 * settings, if any land later).
 */
export async function requireCommentator(): Promise<{
  uid: string;
  accountType: "commentator";
}> {
  const user = await requireAuth();
  const accountType = await getMyAccountType();
  if (accountType !== "commentator") {
    const err = new Error("Esta acción es solo para cuentas cliente.");
    (err as { kind?: string }).kind = "forbidden";
    (err as { currentAccountType?: AccountType | null }).currentAccountType =
      accountType;
    throw err;
  }
  return { uid: user.uid, accountType };
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

/**
 * Write-once setter for `users/{uid}.accountType`.
 *
 * Three outcomes (typed as a discriminated union — see
 * `SetAccountTypeOnceResult`):
 *
 *   - **First write** → `{ ok: true, locked: true, accountType }`. Doc
 *     is created via a Firestore transaction; audit event
 *     `auth.account_type_locked` fires.
 *   - **Same type already locked** → `{ ok: true, locked: false }`.
 *     Idempotent no-op (no audit). Callers (e.g. signup) invoke this
 *     defensively on every fresh session; we silence the audit so the
 *     trail isn't flooded.
 *   - **Opposite type already locked** → `{ ok: false, error: {
 *     kind: 'account-type-locked', currentAccountType } }`. Audit event
 *     `auth.account_type_lock_attempt_blocked` fires. The UI surfaces
 *     the static "tu cuenta es X, creá otra para Y" message.
 *
 * Atomicity is provided by the adapter's Firestore transaction —
 * two parallel requests cannot race past the read-then-write window.
 */
export async function setAccountTypeOnce(
  rawInput: unknown,
): Promise<SetAccountTypeOnceResult> {
  const input: SetAccountTypeOnceInput = validateActionInput(
    setAccountTypeOnceSchema,
    rawInput,
  );
  const user = await requireAuth();

  const outcome = await adapter.setAccountTypeOnceRaw({
    uid: user.uid,
    email: user.email ?? null,
    accountType: input.accountType,
    via: input.via,
  });

  if (outcome.kind === "locked-different") {
    await auditLog({
      event: "auth.account_type_lock_attempt_blocked",
      actorId: user.uid,
      resource: `user:${user.uid}`,
      metadata: {
        requestedAccountType: input.accountType,
        currentAccountType: outcome.currentAccountType,
        via: input.via,
      },
    });
    return {
      ok: false,
      error: {
        kind: "account-type-locked",
        currentAccountType: outcome.currentAccountType,
      },
    };
  }

  if (outcome.kind === "created") {
    await auditLog({
      event: "auth.account_type_locked",
      actorId: user.uid,
      resource: `user:${user.uid}`,
      metadata: { accountType: input.accountType, via: input.via },
    });
    updateTag(CACHE_TAGS.user(user.uid));
    return { ok: true, locked: true, accountType: input.accountType };
  }

  // `kind: 'noop-same'` — same type already locked. Idempotent, no audit.
  return { ok: true, locked: false, accountType: input.accountType };
}

// ----------------------------------------------------------------------------
// Lazy migration (ADR-019 § "Lazy migration")
// ----------------------------------------------------------------------------

/**
 * Probes data-plane signals only (drafts + custom claims). The cookie
 * is intentionally NOT consulted here — the cookie carries a pre-auth
 * chooser pick, which is the signup-funnel responsibility (handled in
 * `signUpWithIdToken` / `loginWithIdToken`). Mixing the cookie into
 * the migration would conflate "fresh signup intent" with "legacy
 * account state".
 *
 * Probe order (states A–D from ADR-019 § "Lazy migration"):
 *
 *   1. Has any `listing_drafts` for this uid → **publisher**. Drafts
 *      beat claims and reviews — a draft is the explicit commit to
 *      publishing.
 *   2. Has `Role.Commentator` claim → **commentator**.
 *   3. Has `Role.Model` claim alone → **publisher** (rare: signed up
 *      as publisher but never published).
 *   4. None of the above → return `null`. The caller decides what to
 *      do — typically falls back to the cookie hint (fresh signup) or
 *      surfaces the post-OAuth modal.
 *
 * When the probe finds both account-type roles present (the bug
 * ADR-019 closes), the non-winning role is queued for revocation as a
 * side effect of the migration write.
 */
async function lazyMigrateAccountType(
  user: AuthenticatedUser,
): Promise<AccountType | null> {
  const probed = await probeLegacySignals(user);
  if (!probed) return null;

  const outcome = await adapter.setAccountTypeOnceRaw({
    uid: user.uid,
    email: user.email ?? null,
    accountType: probed.accountType,
    via: "lazy-migration",
  });

  // The race-safe truth, regardless of who wrote the doc first.
  const resolved =
    outcome.kind === "created"
      ? probed.accountType
      : outcome.currentAccountType;

  if (outcome.kind === "created") {
    await auditLog({
      event: "auth.account_type_lazy_migrated",
      actorId: user.uid,
      resource: `user:${user.uid}`,
      metadata: {
        accountType: resolved,
        signals: probed.signals,
        conflictingRoleRevoked: probed.conflictingRoleToRevoke ?? null,
      },
    });
    updateTag(CACHE_TAGS.user(user.uid));

    // Clean up the orphan role from the legacy dual-role bug. Best-
    // effort: the lock is the authority and gating reads the doc, so
    // a failed revoke leaves us with a harmless extra claim. The next
    // login will retry the revoke (the migration is idempotent on the
    // doc but the revoke re-runs because the claim is still there).
    if (probed.conflictingRoleToRevoke) {
      try {
        await revokeRole(user.uid, probed.conflictingRoleToRevoke, user.uid);
      } catch (err) {
        console.error("[users] lazy-migration revoke failed", err);
      }
    }
  }

  return resolved;
}

interface ProbedLegacyAccountType {
  accountType: AccountType;
  /** Free-text labels of the signals consulted, in the order applied. */
  signals: ReadonlyArray<string>;
  /** When set, the lazy-migration path also revokes this role. */
  conflictingRoleToRevoke: Role | null;
}

async function probeLegacySignals(
  user: AuthenticatedUser,
): Promise<ProbedLegacyAccountType | null> {
  // P1: drafts → publisher (states A and C). Defensive try/catch so
  // a Firestore hiccup falls through to the next signal rather than
  // bricking the read.
  let hasDrafts = false;
  try {
    const drafts = await draftsAdapter.listDraftsByOwnerRaw(user.uid);
    hasDrafts = drafts.length > 0;
  } catch (err) {
    console.error("[users] migration probe: drafts read failed", err);
  }

  if (hasDrafts) {
    return {
      accountType: ACCOUNT_TYPE_PUBLISHER,
      signals: ["has-drafts"],
      conflictingRoleToRevoke: user.roles.includes(Role.Commentator)
        ? Role.Commentator
        : null,
    };
  }

  // P2: Role.Commentator claim (and no drafts) → commentator (states B
  // and D). If the user also has Role.Model from the legacy bug, queue
  // it for revocation.
  if (user.roles.includes(Role.Commentator)) {
    return {
      accountType: ACCOUNT_TYPE_COMMENTATOR,
      signals: ["claim-commentator"],
      conflictingRoleToRevoke: user.roles.includes(Role.Model)
        ? Role.Model
        : null,
    };
  }

  // P3: Role.Model claim alone (no drafts yet) → publisher.
  if (user.roles.includes(Role.Model)) {
    return {
      accountType: ACCOUNT_TYPE_PUBLISHER,
      signals: ["claim-model"],
      conflictingRoleToRevoke: null,
    };
  }

  // No data-plane signal — undecided. The caller handles the
  // cookie / modal fallback.
  return null;
}
