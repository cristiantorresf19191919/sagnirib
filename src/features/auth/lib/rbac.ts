/**
 * RBAC primitives for the two-journey registration model.
 *
 * The PDF `mileroticos_flujos_rbac_firebase_es.pdf` defines two parallel
 * journeys, each with its own permission envelope:
 *
 *   - `ROLE_PROFILE_PUBLISHER` (model)
 *       Can create ads/profiles. Goes through phone+email verification
 *       and post-publish photo/document/video moderation.
 *
 *   - `ROLE_COMMENT_PUBLISHER` (commentator)
 *       Cannot publish profiles. Can comment, save favorites, manage
 *       own account.
 *
 * Authoritative enforcement lives in Firebase Security Rules + Cloud
 * Functions per ADR-010. The frontend hides actions for UX, but the rules
 * are the only thing that prevents writes — `frontend hides, rules block`.
 */

export const ROLE_PROFILE_PUBLISHER = "ROLE_PROFILE_PUBLISHER" as const;
export const ROLE_COMMENT_PUBLISHER = "ROLE_COMMENT_PUBLISHER" as const;
export const ROLE_MODERATOR = "ROLE_MODERATOR" as const;
export const ROLE_ADMIN = "ROLE_ADMIN" as const;

export type AppRole =
  | typeof ROLE_PROFILE_PUBLISHER
  | typeof ROLE_COMMENT_PUBLISHER
  | typeof ROLE_MODERATOR
  | typeof ROLE_ADMIN;

/**
 * UX-level "account type" — the value the user picked on the registration
 * chooser. Maps 1:1 to a primary role at activation time. Kept distinct
 * from `AppRole` because the value also drives copy, routing, and the
 * limited-vs-full dashboard decision before the server has minted custom
 * claims.
 */
export const ACCOUNT_TYPE_PUBLISHER = "publisher" as const;
export const ACCOUNT_TYPE_COMMENTATOR = "commentator" as const;

export type AccountType =
  | typeof ACCOUNT_TYPE_PUBLISHER
  | typeof ACCOUNT_TYPE_COMMENTATOR;

export function isAccountType(value: unknown): value is AccountType {
  return value === ACCOUNT_TYPE_PUBLISHER || value === ACCOUNT_TYPE_COMMENTATOR;
}

export function roleForAccountType(accountType: AccountType): AppRole {
  return accountType === ACCOUNT_TYPE_PUBLISHER
    ? ROLE_PROFILE_PUBLISHER
    : ROLE_COMMENT_PUBLISHER;
}

/**
 * Profile state machine — drives the post-publish moderation UI.
 * Mirrors page 3 of the PDF.
 */
export const PROFILE_STATUS = {
  draft: "DRAFT",
  pendingModeration: "PENDING_MODERATION",
  pendingVerification: "PENDING_VERIFICATION",
  active: "ACTIVE",
  rejected: "REJECTED",
} as const;

export type ProfileStatus = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

/**
 * UX-only cookie used to remember which account type the visitor picked
 * during registration. Lets the dashboard and header render the right
 * surface before Firebase custom claims propagate.
 *
 * Real authorization still lives in custom claims + Security Rules.
 */
export const ACCOUNT_TYPE_COOKIE = "biringas:account-type";

/* -------------------------------------------------------------------------- */
/* Feature flags                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Firebase Phone Auth is in beta and not wired yet. The OTP step renders
 * but accepts any 6-digit code optimistically. Flip when reCAPTCHA / App
 * Check are configured (see `.env.example`).
 */
export const PHONE_AUTH_ENABLED = false;

/**
 * Photo / ID / video verification post-publish. Visual flow ships, but
 * the upload + moderation queue is deferred to a follow-up PR.
 */
export const PHOTO_VERIFICATION_ENABLED = false;

/* -------------------------------------------------------------------------- */
/* Role-aware permission probes (UI hints, NOT authorization)                 */
/* -------------------------------------------------------------------------- */

export function hasRole(
  roles: ReadonlyArray<string> | undefined,
  role: AppRole,
): boolean {
  if (!roles) return false;
  return roles.includes(role);
}

export function canPublishProfile(
  roles: ReadonlyArray<string> | undefined,
): boolean {
  // First-publish grants the role on the server, so before that the user
  // has no role yet. Treat "no role at all" as publisher-eligible too —
  // commentators are the only role that explicitly forbids publishing.
  if (!roles || roles.length === 0) return true;
  if (hasRole(roles, ROLE_COMMENT_PUBLISHER)) return false;
  return true;
}

export function isCommentator(
  roles: ReadonlyArray<string> | undefined,
): boolean {
  return hasRole(roles, ROLE_COMMENT_PUBLISHER);
}
