import "server-only";

import type {
  AccountType,
  AccountTypeChosenVia,
  UserRecord,
} from "@/server/users/types";

/**
 * In-memory mock for the users port (ADR-019).
 *
 * Process-local `Map<uid, UserRecord>`. Restart wipes it — that is
 * fine for the dev flow (signups go through the same fresh-process
 * cycle).
 *
 * Mirrors the Firestore adapter's signatures so the barrel can route
 * between them without features knowing which is active. The
 * transaction guarantee of the prod adapter degenerates to "single-
 * threaded JS executes the read-then-write atomically" — which is
 * exactly what we need for a dev mock.
 */

const RECORDS = new Map<string, UserRecord>();

export async function getUserRaw(uid: string): Promise<UserRecord | null> {
  return RECORDS.get(uid) ?? null;
}

export type SetAccountTypeOnceRawOutcome =
  | { kind: "created" }
  | { kind: "noop-same"; currentAccountType: AccountType }
  | { kind: "locked-different"; currentAccountType: AccountType };

export async function setAccountTypeOnceRaw(input: {
  uid: string;
  email: string | null;
  accountType: AccountType;
  via: AccountTypeChosenVia;
}): Promise<SetAccountTypeOnceRawOutcome> {
  const existing = RECORDS.get(input.uid);
  if (existing) {
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

  const nowIso = new Date().toISOString();
  const record: UserRecord = {
    uid: input.uid,
    accountType: input.accountType,
    email: input.email,
    accountTypeChosenAt: nowIso,
    createdAt: nowIso,
    accountTypeChosenVia: input.via,
  };
  RECORDS.set(input.uid, record);
  return { kind: "created" };
}
