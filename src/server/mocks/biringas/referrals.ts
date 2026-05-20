import "server-only";

import {
  codeForUid,
  REFERRAL_REWARD_COP,
  type ReferralRedemption,
  type ReferralStats,
} from "@/server/biringas/referral-types";

/**
 * In-memory referral store. Wiped on dev-server restart, fine for the
 * mocked end-to-end UX. The Firestore implementation will mirror the
 * shape under `referral_codes/{code}` + `referral_redemptions/{id}`.
 */
const REDEMPTIONS: ReferralRedemption[] = [];

let counter = 0;
function nextId() {
  counter += 1;
  return `ref-${Date.now()}-${counter}`;
}

/**
 * Stats for the current user — both as referrer (how many people
 * redeemed MY code) and as redeemer (have I already used somebody
 * else's code?). Single round-trip so the dashboard renders without
 * waterfalls.
 */
export async function getReferralStatsRaw(uid: string): Promise<ReferralStats> {
  const code = codeForUid(uid);
  const redemptions = REDEMPTIONS.filter((r) => r.referrerUid === uid).length;
  const hasRedeemed = REDEMPTIONS.some((r) => r.redeemerUid === uid);
  return {
    code,
    redemptions,
    creditCop: redemptions * REFERRAL_REWARD_COP,
    hasRedeemed,
  };
}

interface RedeemArgs {
  code: string;
  redeemerUid: string;
}

export type RedeemOutcome =
  | { ok: true; redemption: ReferralRedemption }
  | {
      ok: false;
      reason:
        | "unknown-code"
        | "self-redeem"
        | "already-redeemed"
        | "code-already-used-by-redeemer";
    };

/**
 * Attempts to redeem `code` for `redeemerUid`. Idempotent at the
 * (code, redeemer) level — re-trying with the same pair returns the
 * `already-redeemed` reason instead of double-crediting. Self-redeem
 * is rejected.
 *
 * The mock derives the referrer from the code (reverse-lookup via the
 * deterministic helper). The Firestore adapter will read
 * `referral_codes/{code}` and pull `ownerUid` from there.
 */
export async function redeemReferralRaw({
  code,
  redeemerUid,
}: RedeemArgs): Promise<RedeemOutcome> {
  // Mock-side: scan known uids by searching the redemptions log for any
  // code/referrer pair OR fall through with the code as opaque. Without
  // a separate `referral_codes` collection we can't resolve the owner
  // without knowing all uids; the mock treats the code as belonging to
  // a synthetic owner derived from the code itself when no real match
  // exists. This is a TEMPORARY limitation that disappears the moment
  // the Firestore adapter lands.
  const normalized = code.trim().toUpperCase();
  const knownOwner = REDEMPTIONS.find(
    (r) => codeForUid(r.referrerUid) === normalized,
  )?.referrerUid;
  const referrerUid = knownOwner ?? `mock-owner-${normalized}`;

  if (referrerUid === redeemerUid) {
    return { ok: false, reason: "self-redeem" };
  }
  if (REDEMPTIONS.some((r) => r.redeemerUid === redeemerUid)) {
    return { ok: false, reason: "code-already-used-by-redeemer" };
  }
  if (
    REDEMPTIONS.some(
      (r) => r.code === normalized && r.redeemerUid === redeemerUid,
    )
  ) {
    return { ok: false, reason: "already-redeemed" };
  }

  const redemption: ReferralRedemption = {
    id: nextId(),
    code: normalized,
    referrerUid,
    redeemerUid,
    redeemedAt: new Date().toISOString(),
  };
  REDEMPTIONS.push(redemption);
  return { ok: true, redemption };
}
