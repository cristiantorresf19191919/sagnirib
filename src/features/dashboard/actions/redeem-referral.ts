"use server";

import { redeemReferralCode as redeemReferralCodeImpl } from "@/server/biringas";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: { kind: string; message: string };
  data?: T;
}

const REASON_COPY: Record<string, string> = {
  "self-redeem": "No podés redimir tu propio código.",
  "code-already-used-by-redeemer":
    "Ya redimiste un código antes — solo se admite uno por cuenta.",
  "already-redeemed":
    "Este código ya fue redimido por vos.",
  "unknown-code":
    "Ese código no existe. Revisá las letras y volvé a intentar.",
  "referral-disabled":
    "El programa de referidos se activa muy pronto.",
};

export async function redeemReferral(
  input: unknown,
): Promise<ActionResult<{ creditCop: number }>> {
  try {
    const result = await redeemReferralCodeImpl(input);
    if (result.ok) {
      // Mock-side reward — Firestore variant will compute server-side.
      return { ok: true, data: { creditCop: 20_000 } };
    }
    return {
      ok: false,
      error: {
        kind: result.reason,
        message: REASON_COPY[result.reason] ?? "No pudimos redimir el código.",
      },
    };
  } catch (err) {
    const kind = (err as { kind?: unknown })?.kind;
    const message = (err as Error)?.message ?? "Unknown error";
    if (typeof kind === "string") {
      return {
        ok: false,
        error: { kind, message: REASON_COPY[kind] ?? message },
      };
    }
    return { ok: false, error: { kind: "validation", message } };
  }
}
