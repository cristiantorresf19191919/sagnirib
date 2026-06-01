import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type {
  CreateListingDraftRawInput,
  ListingDraftPayload,
  ListingDraftRecord,
  ListingDraftStatus,
} from "@/server/biringas/draft-types";
import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Writes a new draft under `listing_drafts/{draftId}` (ADR-011).
 *
 * `status` is always `pending_review` at write time — promotion to
 * `approved` / `rejected` is admin-side and out of scope for this adapter.
 *
 * The `draftId` is supplied by the barrel (server-minted UUID v4) so the
 * Storage `copyStagedToDraftForOwner` call can address the same id BEFORE
 * the Firestore row exists. If the Firestore write fails after the copy,
 * the resulting orphan blobs are recoverable via the admin sweep.
 *
 * NEVER expose this directly — features call `createListingDraft` from the
 * barrel, which adds validate + requireAuth + audit + role-grant +
 * revalidate.
 *
 * Returns `{ id, hasOtherDrafts }`. `hasOtherDrafts` decides the role-grant
 * branch in the barrel (only on the very first draft per user).
 */
export async function createListingDraftRaw(
  input: CreateListingDraftRawInput,
): Promise<{ id: string; hasOtherDrafts: boolean }> {
  const db = getDb();
  const submittedAt = Timestamp.now();

  // Cheap probe: does this user already have any draft? Decides role-grant.
  // We do not block resubmissions — multiple drafts per ownerUid are allowed.
  let hasOtherDrafts = false;
  try {
    const prior = await db
      .collection("listing_drafts")
      .where("ownerUid", "==", input.ownerUid)
      .limit(1)
      .get();
    hasOtherDrafts = !prior.empty;
  } catch (err) {
    throw wrapFirestoreError("createListingDraft:probePrior", err);
  }

  try {
    await db.collection("listing_drafts").doc(input.draftId).set({
      ownerUid: input.ownerUid,
      personId: input.personId,
      status: "pending_review",
      payload: serializePayload(input.payload),
      submittedAt,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    throw wrapFirestoreError("createListingDraft:set", err);
  }

  return { id: input.draftId, hasOtherDrafts };
}

/**
 * Probe used for slug uniqueness — returns whether ANY non-rejected draft
 * already claims this `preferredSlug`. Called by the barrel BEFORE writing
 * a new draft so the caller gets a clean error message instead of two
 * drafts racing for the same slug at admin-approval time.
 *
 * Uses Firestore's automatic single-field index on `payload.details.preferredSlug`.
 * Status is filtered in memory (rejected drafts are NOT a conflict — the
 * modelo can re-submit with the same slug after a rejection). Trading a
 * tiny read overhead (a handful of docs per slug) for one fewer composite
 * index to maintain.
 */
export async function findActiveDraftBySlug(slug: string): Promise<boolean> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listing_drafts")
      .where("payload.details.preferredSlug", "==", slug)
      .limit(20)
      .get();
    for (const doc of snap.docs) {
      const status = (doc.data() as { status?: unknown }).status;
      // `rejected` and `cancelled` (ADR-020) both release the slug.
      if (status === "pending_review" || status === "approved") {
        return true;
      }
    }
    return false;
  } catch (err) {
    throw wrapFirestoreError("findActiveDraftBySlug", err);
  }
}

/**
 * ADR-020 cascade. Flips `listing_drafts/{draftId}.status` to
 * `cancelled` and stamps `cancelledAt`. The owner-check is performed
 * inside the transaction to defend against the (impossible-in-practice)
 * case where the barrel's pre-read raced with a writer; the doc must
 * still belong to `ownerUid` at write time.
 *
 * Idempotent — re-cancelling an already-cancelled draft is a no-op.
 */
export async function cancelDraftRaw(
  draftId: string,
  ownerUid: string,
): Promise<void> {
  const db = getDb();
  const ref = db.collection("listing_drafts").doc(draftId);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const data = snap.data() as { ownerUid?: unknown; status?: unknown };
      if (data.ownerUid !== ownerUid) {
        const err = new Error(
          "cancelDraft: caller is not the owner of this draft",
        );
        (err as { kind?: string }).kind = "permission-denied";
        throw err;
      }
      if (data.status === "cancelled") return;
      tx.set(
        ref,
        {
          status: "cancelled",
          cancelledAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  } catch (err) {
    throw wrapFirestoreError("cancelDraft", err);
  }
}

/**
 * Owner-side edit of a `pending_review` draft. Overwrites the whole
 * `payload` map with the barrel-merged payload (the barrel preserves the
 * locked fields — gallery/videos/shortBio/bio/publish — so the only changes
 * here are the editable ones). The owner + status checks run INSIDE the
 * transaction to defend against the (impossible-in-practice) race where the
 * barrel's pre-read saw a different state; the doc must still belong to
 * `ownerUid` and be `pending_review` at write time.
 */
export async function updateListingDraftRaw(input: {
  ownerUid: string;
  draftId: string;
  payload: ListingDraftPayload;
}): Promise<void> {
  const db = getDb();
  const ref = db.collection("listing_drafts").doc(input.draftId);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const err = new Error("updateListingDraft: draft not found");
        (err as { kind?: string }).kind = "not-found";
        throw err;
      }
      const data = snap.data() as { ownerUid?: unknown; status?: unknown };
      if (data.ownerUid !== input.ownerUid) {
        const err = new Error(
          "updateListingDraft: caller is not the owner of this draft",
        );
        (err as { kind?: string }).kind = "permission-denied";
        throw err;
      }
      if (data.status !== "pending_review") {
        const err = new Error(
          "updateListingDraft: only drafts in review can be edited",
        );
        (err as { kind?: string }).kind = "invalid-argument";
        throw err;
      }
      tx.set(
        ref,
        {
          payload: serializePayload(input.payload),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
  } catch (err) {
    throw wrapFirestoreError("updateListingDraft", err);
  }
}

/**
 * Firestore tolerates plain JS values inside maps, but readonly arrays from
 * TS need to be made writable so the SDK does not complain. Otherwise the
 * payload is stored as-is — domain shape is the contract.
 */
function serializePayload(
  payload: CreateListingDraftRawInput["payload"],
): Record<string, unknown> {
  return {
    details: {
      ...payload.details,
      attention: [...payload.details.attention],
      contactChannels: [...payload.details.contactChannels],
    },
    description: {
      ...payload.description,
      services: [...payload.description.services],
      meetingContexts: [...payload.description.meetingContexts],
      gallery: payload.description.gallery.map((g) => ({ path: g.path })),
    },
    attributes: {
      ...payload.attributes,
      languages: [...payload.attributes.languages],
    },
    publish: {
      ...payload.publish,
      addOnIds: [...payload.publish.addOnIds],
    },
  };
}

/**
 * Lightweight projection of a stored draft for the seller dashboard.
 * Mirrors the mock's `DraftSummary` shape so the barrel can route to
 * either provider without remapping.
 */
export interface DraftSummary {
  id: string;
  preferredSlug: string;
  displayName: string;
  city: string;
  category: string;
  status: ListingDraftStatus;
  submittedAt: string;
}

/**
 * Returns all drafts owned by `ownerUid`, newest-first. The barrel
 * already enforces `requireAuth` and passes the resolved uid here, so
 * this adapter trusts its input. Composite index required:
 * `(ownerUid asc, submittedAt desc)`.
 */
export async function listDraftsByOwnerRaw(
  ownerUid: string,
): Promise<ReadonlyArray<DraftSummary>> {
  try {
    const snap = await getDb()
      .collection("listing_drafts")
      .where("ownerUid", "==", ownerUid)
      .orderBy("submittedAt", "desc")
      .limit(25)
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      const details = (data.payload?.details ?? {}) as Record<string, unknown>;
      const submitted = data.submittedAt as Timestamp | undefined;
      return {
        id: doc.id,
        preferredSlug: String(details.preferredSlug ?? ""),
        displayName: String(details.displayName ?? ""),
        city: String(details.city ?? ""),
        category: String(details.category ?? ""),
        status: coerceStatus(data.status),
        submittedAt: (submitted?.toDate() ?? new Date()).toISOString(),
      };
    });
  } catch (err) {
    throw wrapFirestoreError("listDraftsByOwnerRaw", err);
  }
}

/**
 * Owner-gated single-draft read used by `/mi-cuenta/borradores/[id]`.
 * Returns `null` when the doc does not exist OR when it belongs to a
 * different user — the latter is treated as a 404 on purpose so an
 * attacker probing draft ids cannot distinguish "missing" from
 * "exists but not yours".
 *
 * The barrel passes the `requireAuth().uid` as `ownerUid`. The doc
 * read is a direct `.doc(id).get()` — no index needed.
 */
export async function getDraftByIdForOwnerRaw(
  ownerUid: string,
  draftId: string,
): Promise<ListingDraftRecord | null> {
  try {
    const doc = await getDb()
      .collection("listing_drafts")
      .doc(draftId)
      .get();
    if (!doc.exists) return null;
    const data = doc.data() ?? {};
    if (data.ownerUid !== ownerUid) return null;
    const submitted = data.submittedAt as Timestamp | undefined;
    const rejectionReason =
      typeof data.rejectionReason === "string" && data.rejectionReason.length > 0
        ? data.rejectionReason
        : undefined;
    return {
      id: doc.id,
      ownerUid: String(data.ownerUid),
      ...(typeof data.personId === "string" ? { personId: data.personId } : {}),
      status: coerceStatus(data.status),
      payload: deserializePayload(data.payload),
      submittedAt: (submitted?.toDate() ?? new Date()).toISOString(),
      ...(rejectionReason ? { rejectionReason } : {}),
    };
  } catch (err) {
    throw wrapFirestoreError("getDraftByIdForOwnerRaw", err);
  }
}

/**
 * Coerce the persisted `status` string to the typed enum. Anything we
 * don't recognize falls back to `pending_review` — the safest default
 * for the UI (read-only "Ver detalles" path).
 */
function coerceStatus(raw: unknown): ListingDraftStatus {
  if (raw === "approved" || raw === "rejected" || raw === "cancelled") {
    return raw;
  }
  return "pending_review";
}

/**
 * Inverse of `serializePayload`. Firestore stored the wizard payload as
 * a nested plain map; this fills any missing optional fields with safe
 * defaults so the UI never has to handle `undefined` for required
 * domain fields. The schema validated everything at write time, so the
 * only cases we expect to defend against are legacy / partial docs
 * written before a schema bump.
 */
function deserializePayload(raw: unknown): ListingDraftPayload {
  const p = (raw ?? {}) as Record<string, unknown>;
  const details = (p.details ?? {}) as Record<string, unknown>;
  const description = (p.description ?? {}) as Record<string, unknown>;
  const attributes = (p.attributes ?? {}) as Record<string, unknown>;
  const publish = (p.publish ?? {}) as Record<string, unknown>;
  return {
    details: {
      displayName: String(details.displayName ?? ""),
      age: Number(details.age ?? 0),
      city: String(details.city ?? ""),
      category:
        details.category === "prepagos" ||
        details.category === "masajes" ||
        details.category === "videollamadas"
          ? details.category
          : "prepagos",
      phone: String(details.phone ?? ""),
      preferredSlug: String(details.preferredSlug ?? ""),
      pricePerHour: Number(details.pricePerHour ?? 0),
      attention: Array.isArray(details.attention)
        ? (details.attention as ReadonlyArray<string>)
        : [],
      contactChannels: Array.isArray(details.contactChannels)
        ? (details.contactChannels as ReadonlyArray<string>)
        : [],
    },
    description: {
      shortBio: String(description.shortBio ?? ""),
      bio: String(description.bio ?? ""),
      services: Array.isArray(description.services)
        ? (description.services as ReadonlyArray<string>)
        : [],
      meetingContexts: Array.isArray(description.meetingContexts)
        ? (description.meetingContexts as ReadonlyArray<string>)
        : [],
      faceVisible: Boolean(description.faceVisible),
      paymentByCard: Boolean(description.paymentByCard),
      gallery: Array.isArray(description.gallery)
        ? (description.gallery as ReadonlyArray<{ path?: unknown }>)
            .map((g) => ({ path: String(g.path ?? "") }))
            .filter((g) => g.path.length > 0)
        : [],
      videos: Array.isArray(description.videos)
        ? (description.videos as ReadonlyArray<{
            path?: unknown;
            durationSeconds?: unknown;
          }>)
            .map((v) => ({
              path: String(v.path ?? ""),
              durationSeconds:
                typeof v.durationSeconds === "number" &&
                Number.isFinite(v.durationSeconds)
                  ? v.durationSeconds
                  : 0,
            }))
            .filter((v) => v.path.length > 0 && v.durationSeconds > 0)
        : [],
    },
    attributes: {
      ethnicity: String(attributes.ethnicity ?? ""),
      hair: String(attributes.hair ?? ""),
      height: String(attributes.height ?? ""),
      body: String(attributes.body ?? ""),
      breast: String(attributes.breast ?? ""),
      country: String(attributes.country ?? ""),
      ...(typeof attributes.pubis === "string" && attributes.pubis.length > 0
        ? { pubis: attributes.pubis }
        : {}),
      languages: Array.isArray(attributes.languages)
        ? (attributes.languages as ReadonlyArray<string>)
        : [],
    },
    publish: {
      packageId: String(publish.packageId ?? "esencial"),
      addOnIds: Array.isArray(publish.addOnIds)
        ? (publish.addOnIds as ReadonlyArray<string>)
        : [],
      billing: publish.billing === "quarterly" ? "quarterly" : "monthly",
      acceptsTerms: Boolean(publish.acceptsTerms),
      acceptsAdult: Boolean(publish.acceptsAdult),
    },
  };
}

// Silence the unused import when this module is consumed without the
// Timestamp branch (e.g. mock-mode bundling). Kept as a value-side
// reference so tree-shaking does not drop it.
void FieldValue;
