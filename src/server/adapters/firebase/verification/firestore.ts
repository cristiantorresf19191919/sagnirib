import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";
import type {
  SubmitVerificationInput,
  VerificationRecord,
  VerificationStatus,
} from "@/server/verification/types";

/**
 * Firestore writes / reads for `verifications/{uid}` (ADR-014).
 *
 * One doc per user, doc id = uid. Resubmission overwrites everything
 * except `createdAt` (preserved via merge).
 */

export async function getVerificationRaw(
  uid: string,
): Promise<VerificationRecord | null> {
  const db = getDb();
  try {
    const snap = await db.collection("verifications").doc(uid).get();
    if (!snap.exists) return null;
    return mapVerificationDoc(uid, snap.data() as Record<string, unknown>);
  } catch (err) {
    throw wrapFirestoreError("getVerification", err);
  }
}

export async function submitVerificationRaw(
  uid: string,
  input: SubmitVerificationInput,
): Promise<void> {
  const db = getDb();
  const ref = db.collection("verifications").doc(uid);

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
          uid,
          status: "pending_review" as VerificationStatus,
          documentFrontPath: input.documentFrontPath,
          documentBackPath: input.documentBackPath,
          selfiePath: input.selfiePath,
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

function mapVerificationDoc(
  uid: string,
  data: Record<string, unknown>,
): VerificationRecord {
  return {
    uid,
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
