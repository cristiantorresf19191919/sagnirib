import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import type {
  DocumentType,
  SubmitVerificationInput,
  VerificationRecord,
  VerificationStatus,
} from "@/server/verification/types";
import { DOCUMENT_TYPES } from "@/server/verification/types";

/**
 * Firestore writes / reads for `verifications/{personId}` (ADR-014 +
 * ADR-018 Phase A).
 *
 * One doc per **person** — the doc id is the personId. Resubmission
 * overwrites everything except `createdAt` (preserved via merge).
 */

export async function getVerificationRaw(
  personId: string,
): Promise<VerificationRecord | null> {
  const db = getDb();
  try {
    const snap = await db.collection("verifications").doc(personId).get();
    if (!snap.exists) return null;
    return mapVerificationDoc(personId, snap.data() as Record<string, unknown>);
  } catch (err) {
    throw wrapFirestoreError("getVerification", err);
  }
}

/**
 * ADR-020 cascade. Hard-deletes `verifications/{personId}`. Idempotent
 * (deleting a non-existent doc is a no-op in Firestore). Storage
 * objects under `verifications/{personId}/` are NOT cleaned up here —
 * a separate sweep job handles orphans (TODO ADR-020 § "Storage GC").
 *
 * The owner check happens in the persons barrel BEFORE this call, so
 * the adapter trusts its input.
 */
export async function deleteVerificationRaw(personId: string): Promise<void> {
  const db = getDb();
  try {
    await db.collection("verifications").doc(personId).delete();
  } catch (err) {
    throw wrapFirestoreError("deleteVerification", err);
  }
}

export async function submitVerificationRaw(
  personId: string,
  ownerUid: string,
  input: SubmitVerificationInput,
): Promise<void> {
  const db = getDb();
  const ref = db.collection("verifications").doc(personId);

  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      const now = Timestamp.now();

      // Refuse to resubmit while a previous submission is still pending
      // review — admin needs to act first. Approved + rejected DO accept
      // resubmissions (rejected restarts; approved is a no-op flip back
      // to pending).
      if (existing.exists) {
        const data = existing.data() as { status?: unknown };
        if (data.status === "pending_review") {
          throw new Error(
            "submitVerification: verification already pending review",
          );
        }
      }

      // Always set status='pending_review' on submit. The admin flips it.
      // Use merge semantics: keep createdAt from the first submission;
      // overwrite everything else.
      const wasFirstSubmit = !existing.exists;
      tx.set(
        ref,
        {
          personId,
          ownerUid,
          status: "pending_review" as VerificationStatus,
          documentFrontPath: input.documentFrontPath,
          documentBackPath: input.documentBackPath,
          selfiePath: input.selfiePath,
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          submittedAt: now,
          ...(wasFirstSubmit ? { createdAt: FieldValue.serverTimestamp() } : {}),
          // Clear stale approval / rejection metadata so the doc reflects
          // the new pending state cleanly.
          approvedAt: FieldValue.delete(),
          approvedByUid: FieldValue.delete(),
          rejectedAt: FieldValue.delete(),
          rejectedByUid: FieldValue.delete(),
          rejectionReason: FieldValue.delete(),
        },
        { merge: true },
      );
    });
  } catch (err) {
    throw wrapFirestoreError("submitVerification", err);
  }
}

function tsToIso(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

/**
 * Per ADR-018 amendment § "Document number uniqueness". Returns the
 * personId (== doc id) and ownerUid of an EXISTING non-rejected
 * `verifications/{*}` doc whose `(documentType, documentNumber)`
 * matches the supplied pair, or `null` if none.
 *
 * Caller (the `submitVerification` barrel) uses this to refuse a
 * collision BEFORE writing. Composite index required:
 *   `(documentType ASC, documentNumber ASC, status ASC)`
 * Registered in `firestore.indexes.json`.
 *
 * Rejected rows do NOT collide — releasing the number on rejection
 * is the ADR's "release-on-reject" rule. The single `status != rejected`
 * filter would be a range query (forbidden alongside equality on two
 * other fields), so we list the two non-rejected statuses
 * (`pending_review`, `approved`) explicitly via an `in` filter on
 * status. Both are queryable from the same composite index.
 */
export async function findActiveKycByDocumentNumberRaw(args: {
  documentType: DocumentType;
  documentNumber: string;
  excludePersonId?: string;
}): Promise<{ personId: string; ownerUid?: string } | null> {
  const db = getDb();
  try {
    const snap = await db
      .collection("verifications")
      .where("documentType", "==", args.documentType)
      .where("documentNumber", "==", args.documentNumber)
      .where("status", "in", ["pending_review", "approved"])
      .limit(2)
      .get();
    for (const doc of snap.docs) {
      // The caller resubmitting against their OWN existing doc is not a
      // collision — they're updating their own KYC. `excludePersonId`
      // lets the barrel pass the caller's personId so their own row is
      // skipped.
      if (args.excludePersonId && doc.id === args.excludePersonId) continue;
      const data = doc.data() as { ownerUid?: unknown };
      return {
        personId: doc.id,
        ownerUid:
          typeof data.ownerUid === "string" ? data.ownerUid : undefined,
      };
    }
    return null;
  } catch (err) {
    throw wrapFirestoreError("findActiveKycByDocumentNumber", err);
  }
}

function coerceDocumentType(value: unknown): DocumentType | undefined {
  if (typeof value !== "string") return undefined;
  return (DOCUMENT_TYPES as ReadonlyArray<string>).includes(value)
    ? (value as DocumentType)
    : undefined;
}

function mapVerificationDoc(
  personId: string,
  data: Record<string, unknown>,
): VerificationRecord {
  const docType = coerceDocumentType(data.documentType);
  return {
    personId,
    ...(typeof data.ownerUid === "string" ? { ownerUid: data.ownerUid } : {}),
    status: (data.status as VerificationStatus) ?? "not_submitted",
    documentFrontPath:
      typeof data.documentFrontPath === "string"
        ? data.documentFrontPath
        : undefined,
    documentBackPath:
      typeof data.documentBackPath === "string"
        ? data.documentBackPath
        : undefined,
    selfiePath:
      typeof data.selfiePath === "string" ? data.selfiePath : undefined,
    ...(docType ? { documentType: docType } : {}),
    documentNumber:
      typeof data.documentNumber === "string" ? data.documentNumber : undefined,
    submittedAt: tsToIso(data.submittedAt),
    createdAt: tsToIso(data.createdAt),
    approvedAt: tsToIso(data.approvedAt),
    approvedByUid:
      typeof data.approvedByUid === "string" ? data.approvedByUid : undefined,
    rejectedAt: tsToIso(data.rejectedAt),
    rejectedByUid:
      typeof data.rejectedByUid === "string" ? data.rejectedByUid : undefined,
    rejectionReason:
      typeof data.rejectionReason === "string"
        ? data.rejectionReason
        : undefined,
  };
}
