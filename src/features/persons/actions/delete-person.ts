"use server";

import { deleteMyPerson, type DeletePersonOutcome } from "@/server/persons";

export type DeletePersonResult =
  | { ok: true; outcome: DeletePersonOutcome["kind"] }
  | { ok: false; error: { kind: string; message: string } };

/**
 * Action-layer wrapper around `deleteMyPerson` (ADR-020). Returns a
 * typed result the client can render — the "blocked because a
 * published listing exists" branch is not a thrown error here, it is a
 * contract outcome (`outcome: "blocked-published-listing"`).
 *
 * The thrown branch is reserved for unexpected failures (network /
 * Firestore errors / unauthenticated callers). The client maps them
 * to a generic "no se pudo eliminar el perfil" toast.
 */
export async function deletePersonAction(
  personId: unknown,
): Promise<DeletePersonResult> {
  try {
    const outcome = await deleteMyPerson(personId);
    return { ok: true, outcome: outcome.kind };
  } catch (err) {
    const e = err as { kind?: string; message?: string };
    return {
      ok: false,
      error: {
        kind: e.kind ?? "internal",
        message: e.message ?? "deleteMyPerson failed",
      },
    };
  }
}
