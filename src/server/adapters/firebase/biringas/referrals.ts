import "server-only";

import {
  codeForUid,
  REFERRAL_REWARD_COP,
  type ReferralStats,
} from "@/server/biringas/referral-types";

/**
 * Firestore adapter for referrals — STUB.
 *
 * `getReferralStatsRaw` returns a zero-state for now (code is still
 * derivable from the uid so the dashboard can render a share link),
 * which lets the surface ship before the `referral_redemptions`
 * collection + composite indexes are deployed.
 *
 * `redeemReferralRaw` throws a typed error so the action layer can
 * surface a friendly "muy pronto" message. The real implementation
 * will write `referral_codes/{code}` (owner ref) +
 * `referral_redemptions/{auto-id}` with server timestamps.
 */

export type RedeemOutcome =
  | { ok: true; redemption: never }
  | {
      ok: false;
      reason:
        | "unknown-code"
        | "self-redeem"
        | "already-redeemed"
        | "code-already-used-by-redeemer";
    };

export async function getReferralStatsRaw(uid: string): Promise<ReferralStats> {
  return {
    code: codeForUid(uid),
    redemptions: 0,
    creditCop: 0 * REFERRAL_REWARD_COP,
    hasRedeemed: false,
  };
}

export async function redeemReferralRaw(
  _args: { code: string; redeemerUid: string },
): Promise<RedeemOutcome> {
  throw new ReferralDisabledError(
    "El programa de referidos se activa cuando la colección `referral_redemptions` esté lista.",
  );
}

class ReferralDisabledError extends Error {
  readonly kind = "referral-disabled" as const;
  constructor(message: string) {
    super(message);
    this.name = "ReferralDisabledError";
  }
}
