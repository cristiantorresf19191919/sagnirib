import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import type {
  AccountType,
  AccountTypeChosenVia,
  UserRecord,
} from "@/server/users/types";

/**
 * Firestore reads / writes for `users/{uid}` (ADR-019).
 *
 * The collection has one doc per Firebase Auth user. The
 * `accountType` field is write-once — once set it must never be
 * mutated. Atomicity is enforced by `setAccountTypeOnceRaw` running
 * read-then-write inside a Firestore transaction; two parallel
 * requests cannot both observe the doc as absent.
 *
 * Public surface (consumed by `src/server/users/index.ts`):
 *   - `getUserRaw(uid)`
 *   - `setAccountTypeOnceRaw({ uid, email, accountType, via })`
 *
 * Hardcoded collection name lives here per ADR-010 § "data ownership"
 * — features do not know the collection exists.
 */

const COLLECTION = "users";

export async function getUserRaw(
  uid: string,
): Promise<UserRecord | null> {
  const db = getDb();
  try {
    const snap = await db.collection(COLLECTION).doc(uid).get();
    if (!snap.exists) return null;
    return mapUserDoc(uid, snap.data() as Record<string, unknown>);
  } catch (err) {
    throw wrapFirestoreError("getUser", err);
  }
}

export type SetAccountTypeOnceRawOutcome =
  | { kind: "created" }
  | { kind: "noop-same"; currentAccountType: AccountType }
  | { kind: "locked-different"; currentAccountType: AccountType };

/**
 * Atomic write-once setter. Runs inside a Firestore transaction so the
 * read-then-write window is invisible to concurrent requests.
 *
 * Three outcomes, mapped 1:1 to the discriminated union the barrel
 * returns to features:
 *
 *   - Doc missing → write + return `created`.
 *   - Doc present, accountType == input → no write, return `noop-same`.
 *   - Doc present, accountType != input → no write, return
 *     `locked-different` with the persisted accountType so the barrel
 *     can include it in the audit + UI error.
 */
export async function setAccountTypeOnceRaw(input: {
  uid: string;
  email: string | null;
  accountType: AccountType;
  via: AccountTypeChosenVia;
}): Promise<SetAccountTypeOnceRawOutcome> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(input.uid);

  try {
    return await db.runTransaction<SetAccountTypeOnceRawOutcome>(
      async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) {
          const existing = mapUserDoc(
            input.uid,
            snap.data() as Record<string, unknown>,
          );
          if (existing.accountType === input.accountType) {
            return {
              kind: "noop-same",
              currentAccountType: existing.accountType,
            };
          }
          return {
            kind: "locked-different",
            currentAccountType: existing.accountType,
          };
        }

        tx.set(ref, {
          uid: input.uid,
          accountType: input.accountType,
          email: input.email,
          accountTypeChosenVia: input.via,
          accountTypeChosenAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        });
        return { kind: "created" };
      },
    );
  } catch (err) {
    throw wrapFirestoreError("setAccountTypeOnce", err);
  }
}

// ----------------------------------------------------------------------------
// Internals
// ----------------------------------------------------------------------------

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  // serverTimestamp not yet resolved (read happens on the same request
  // as the write before re-read — unlikely here because we don't
  // re-read after the transaction). Defensive fall-back keeps the
  // return type total.
  return new Date().toISOString();
}

function coerceAccountType(value: unknown): AccountType {
  if (value === "publisher" || value === "commentator") return value;
  // Defensive: a doc that somehow lacks an accountType is treated as
  // "publisher" because (a) it must have come from legacy data and
  // (b) publishers are the more constrained role — false-positive
  // commentator would let writes through that should not pass. This
  // branch should never fire after Phase A migration is complete.
  return "publisher";
}

function coerceVia(value: unknown): AccountTypeChosenVia {
  if (
    value === "pre-oauth" ||
    value === "post-oauth-modal" ||
    value === "lazy-migration"
  ) {
    return value;
  }
  return "lazy-migration";
}

function mapUserDoc(
  uid: string,
  data: Record<string, unknown>,
): UserRecord {
  const chosenAt = tsToIso(data.accountTypeChosenAt);
  return {
    uid,
    accountType: coerceAccountType(data.accountType),
    email: typeof data.email === "string" ? data.email : null,
    accountTypeChosenAt: chosenAt,
    createdAt: tsToIso(data.createdAt) || chosenAt,
    accountTypeChosenVia: coerceVia(data.accountTypeChosenVia),
  };
}
