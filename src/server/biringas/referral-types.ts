import "server-only";

/**
 * Referral domain contract.
 *
 * Mocks today; persists to Firestore later under `referral_codes/{code}`
 * + `referral_redemptions/{auto-id}`. Codes are deterministic per uid
 * so a user always gets the same share-link across logins, with no
 * collision concerns (uid uniqueness propagates).
 *
 * Credit amount is a fixed COP $20k on each side at redemption time;
 * a future variant can carry a campaign-specific amount.
 */
export interface ReferralStats {
  /** 6-char uppercase code derived from the user's uid. */
  code: string;
  /** Count of users who redeemed THIS user's code. */
  redemptions: number;
  /** COP credit accrued by this user from referrals (mock = redemptions * 20000). */
  creditCop: number;
  /** True when this user has already redeemed someone else's code. */
  hasRedeemed: boolean;
}

export interface ReferralRedemption {
  id: string;
  code: string;
  referrerUid: string;
  redeemerUid: string;
  redeemedAt: string;
}

export const REFERRAL_REWARD_COP = 20_000;
export const REFERRAL_CODE_LENGTH = 6;

/**
 * Deterministic 6-char uppercase code derived from a uid via FNV-1a +
 * base36. Same uid → same code, forever. Pure helper (no IO), exposed
 * so adapters + the barrel + the dashboard UI agree byte-for-byte.
 */
export function codeForUid(uid: string): string {
  let hash = 2166136261;
  for (let i = 0; i < uid.length; i += 1) {
    hash ^= uid.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  // Two passes for extra entropy on short uids.
  let hash2 = hash;
  for (let i = uid.length - 1; i >= 0; i -= 1) {
    hash2 ^= uid.charCodeAt(i);
    hash2 = (hash2 * 16777619) >>> 0;
  }
  const blob = (hash.toString(36) + hash2.toString(36)).toUpperCase();
  // Strip ambiguous chars (0/O, I/1) so the code is dictation-safe.
  const safe = blob.replace(/[O0I1]/g, "X");
  return safe.slice(0, REFERRAL_CODE_LENGTH).padEnd(
    REFERRAL_CODE_LENGTH,
    "X",
  );
}
