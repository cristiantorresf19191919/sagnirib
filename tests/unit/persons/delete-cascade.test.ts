import { beforeEach, describe, expect, it } from "vitest";

import * as draftsMock from "@/server/mocks/biringas/create-draft";
import * as personsMock from "@/server/mocks/persons";
import * as verificationMock from "@/server/mocks/verification";

/**
 * Cascade-primitive tests for the ADR-020 person soft-delete flow.
 *
 * The `deleteMyPerson` barrel function is a fixed-order composition
 * over four mock adapter calls; exercising the primitives end-to-end
 * is enough proof for the cascade itself. Auth / ownership / audit
 * are tested by reading the production code — they live in the
 * barrel above these adapter calls and follow the established
 * mutation contract (validateActionInput → requireAuth → adapter →
 * auditLog → updateTag).
 *
 * Mocks are module-scoped Maps; tests clear state via fresh
 * createPersonRaw / createListingDraftRaw calls per `it`.
 */

const OWNER_A = "uid_test_owner_A";
const OWNER_B = "uid_test_owner_B";

const DRAFT_PAYLOAD = {
  details: {
    displayName: "Test",
    age: 25,
    city: "Bogotá",
    category: "prepagos" as const,
    phone: "+57 300 0000000",
    preferredSlug: "test-cascade",
    pricePerHour: 100_000,
    attention: [],
    contactChannels: [],
  },
  description: {
    shortBio: "",
    bio: "",
    services: [],
    meetingContexts: [],
    faceVisible: false,
    paymentByCard: false,
    availableNow: false,
    gallery: [],
    videos: [],
  },
  attributes: {
    ethnicity: "",
    hair: "",
    height: "",
    body: "",
    breast: "",
    country: "",
    languages: [],
  },
  publish: {
    packageId: "esencial",
    addOnIds: [],
    billing: "monthly" as const,
    acceptsTerms: true,
    acceptsAdult: true,
  },
};

describe("persons mock: markPersonDeletedRaw + list filter", () => {
  it("hides soft-deleted rows from listPersonsByOwnerRaw", async () => {
    const live = await personsMock.createPersonRaw({
      ownerUid: OWNER_A,
      displayName: "Alive",
    });
    const doomed = await personsMock.createPersonRaw({
      ownerUid: OWNER_A,
      displayName: "Doomed",
    });

    await personsMock.markPersonDeletedRaw(
      doomed.id,
      new Date().toISOString(),
    );

    const visible = await personsMock.listPersonsByOwnerRaw(OWNER_A);
    const ids = visible.map((p) => p.id);
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(doomed.id);
  });

  it("never crosses owners — OWNER_B does not see OWNER_A's persons", async () => {
    await personsMock.createPersonRaw({
      ownerUid: OWNER_A,
      displayName: "A-only",
    });
    const visibleForB = await personsMock.listPersonsByOwnerRaw(OWNER_B);
    expect(visibleForB.find((p) => p.displayName === "A-only")).toBeUndefined();
  });

  it("getPersonRaw still resolves a soft-deleted row (audit trail)", async () => {
    const p = await personsMock.createPersonRaw({
      ownerUid: OWNER_A,
      displayName: "Audit-Visible",
    });
    const deletedAt = new Date().toISOString();
    await personsMock.markPersonDeletedRaw(p.id, deletedAt);

    const after = await personsMock.getPersonRaw(p.id);
    expect(after).not.toBeNull();
    expect(after?.deletedAt).toBe(deletedAt);
  });
});

describe("drafts mock: cancelDraftRaw", () => {
  let draftId: string;
  // The mock's DRAFTS array is module-scoped — previous `it` blocks
  // leave entries behind. Use a fresh slug per test so
  // `findActiveDraftBySlug` doesn't pick up siblings from earlier
  // tests.
  let slug: string;

  beforeEach(async () => {
    slug = `cascade-${Math.random().toString(36).slice(2, 10)}`;
    const result = await draftsMock.createListingDraftRaw({
      ownerUid: OWNER_A,
      draftId: `draft_${Math.random().toString(36).slice(2, 10)}`,
      personId: "person_X",
      payload: {
        ...DRAFT_PAYLOAD,
        details: { ...DRAFT_PAYLOAD.details, preferredSlug: slug },
      },
    });
    draftId = result.id;
  });

  it("flips status to cancelled when owner matches", async () => {
    await draftsMock.cancelDraftRaw(draftId, OWNER_A);

    const after = await draftsMock.getDraftByIdForOwnerRaw(OWNER_A, draftId);
    expect(after).not.toBeNull();
    expect(after?.status).toBe("cancelled");
  });

  it("no-ops when the caller is not the owner", async () => {
    await draftsMock.cancelDraftRaw(draftId, OWNER_B);

    const after = await draftsMock.getDraftByIdForOwnerRaw(OWNER_A, draftId);
    expect(after?.status).toBe("pending_review");
  });

  it("is idempotent — second cancel is a no-op", async () => {
    await draftsMock.cancelDraftRaw(draftId, OWNER_A);
    await expect(
      draftsMock.cancelDraftRaw(draftId, OWNER_A),
    ).resolves.toBeUndefined();
  });

  it("releases the slug — findActiveDraftBySlug returns false", async () => {
    expect(await draftsMock.findActiveDraftBySlug(slug)).toBe(true);

    await draftsMock.cancelDraftRaw(draftId, OWNER_A);

    expect(await draftsMock.findActiveDraftBySlug(slug)).toBe(false);
  });
});

describe("verification mock: deleteVerificationRaw", () => {
  it("removes the doc and is idempotent", async () => {
    const personId = `vp_${Math.random().toString(36).slice(2, 10)}`;
    await verificationMock.submitVerificationRaw(personId, OWNER_A, {
      personId,
      documentFrontPath: `verifications/${personId}/document_front.jpg`,
      documentBackPath: `verifications/${personId}/document_back.jpg`,
      selfiePath: `verifications/${personId}/selfie.jpg`,
      documentType: "CC",
      documentNumber: "1000000001",
    });
    expect(await verificationMock.getVerificationRaw(personId)).not.toBeNull();

    await verificationMock.deleteVerificationRaw(personId);
    expect(await verificationMock.getVerificationRaw(personId)).toBeNull();

    // Idempotent — second delete does not throw.
    await expect(
      verificationMock.deleteVerificationRaw(personId),
    ).resolves.toBeUndefined();
  });
});
