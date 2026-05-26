"use server";

import { createMyPerson } from "@/server/persons";

export interface CreatePersonResult {
  ok: boolean;
  personId?: string;
  error?: { kind: string; message: string };
}

/**
 * Action-layer wrapper around the persons barrel. Called from the
 * dashboard "Crear nueva modelo" CTA — returns the freshly-minted
 * personId so the client can redirect (or just refresh) into the
 * new person's KYC flow.
 *
 * Validation, auth, audit and cache invalidation all happen inside
 * `createMyPerson`. This wrapper exists only to (a) live on the
 * Server-Action surface that clients can call directly and (b) map
 * thrown errors into a friendly typed result the UI can render.
 */
export async function createPersonAction(
  input: unknown,
): Promise<CreatePersonResult> {
  try {
    const record = await createMyPerson(input);
    return { ok: true, personId: record.id };
  } catch (err) {
    const e = err as { kind?: string; message?: string };
    return {
      ok: false,
      error: {
        kind: e.kind ?? "internal",
        message: e.message ?? "createMyPerson failed",
      },
    };
  }
}
