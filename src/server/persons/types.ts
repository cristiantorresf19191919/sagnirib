import "server-only";

import type { VerificationStatus } from "@/server/verification/types";

export { PERSON_LIMITS } from "@/shared/persons/limits";

/**
 * Domain types for the `persons/{personId}` port (ADR-018).
 *
 * A "person" represents a physical modelo whose identity the platform
 * vouches for. The Firebase Auth user is the **account owner**; it may
 * own 1 person (modelo individual) or N persons (partner / agencia).
 *
 * The `Persons` port is metadata-only: KYC documents continue to live
 * in `verifications/{personId}` (we reuse the existing collection /
 * bucket prefix from ADR-014; the doc id space is opaque, so personId
 * fits the same regex as the legacy uid). The `kyc` map below is a
 * denormalized read of the verification status — a single
 * dashboard render needs zero joins. The verification port remains
 * the source of truth for write.
 *
 * Person ↔ listing is **1:1** (ADR-018 § "No duplicate listings per
 * person"). The two `active*` fields below let the dashboard surface
 * "esta modelo ya tiene perfil activo, actualizá el existente" without
 * a join.
 */

export interface PersonKycSummary {
  status: VerificationStatus;
  /** Latest submit timestamp (ISO). Undefined when status = `not_submitted`. */
  submittedAt?: string;
  /** Approval timestamp (ISO). Undefined unless status = `approved`. */
  approvedAt?: string;
  /** Rejection reason (3..500). Surfaces to the dashboard KYC card. */
  rejectionReason?: string;
}

export interface PersonRecord {
  id: string;
  ownerUid: string;
  displayName: string;
  /** Denormalized read of the matching `verifications/{personId}` doc. */
  kyc: PersonKycSummary;
  /** Current in-flight draft (1:1 with listing — ADR-018). */
  activeDraftId: string | null;
  /** Slug of the current published listing for this person. */
  activeListingSlug: string | null;
  /** ISO timestamp of person creation. */
  createdAt: string;
  /**
   * Soft-delete marker (ADR-020). When non-null, the person has been
   * deleted by its owner and the dashboard query filters it out. The
   * doc is kept so `auditLog` event resources (`person:<id>`) still
   * resolve in trust&safety queries.
   */
  deletedAt: string | null;
}

export interface CreatePersonInput {
  /** Friendly label shown on the dashboard. 3..64 chars. */
  displayName: string;
}

