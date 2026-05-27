import { describe, expect, it } from "vitest";

import { PLANS_ENABLED } from "@/features/enrollment/lib/pricing";
import { toServerPayload } from "@/features/enrollment/lib/to-server-payload";
import { INITIAL_DRAFT } from "@/features/enrollment/lib/types";

function fullDraft() {
  return {
    ...INITIAL_DRAFT,
    details: {
      ...INITIAL_DRAFT.details,
      displayName: "  Alma  ",
      age: "24",
      city: "Medellín",
      category: "prepagos" as const,
      phone: "+57 300 1234567",
      preferredSlug: "alma-medellin",
      pricePerHour: "200000",
      attention: ["hombres"] as const,
      contactChannels: ["whatsapp"] as const,
    },
    description: {
      ...INITIAL_DRAFT.description,
      shortBio: "  short  ",
      bio: "una descripción larga que supera los sesenta caracteres mínimos requeridos.",
      services: ["Compañía"],
      meetingContexts: ["Hotel"],
      faceVisible: true,
      gallery: [
        {
          id: "1",
          name: "p1.jpg",
          previewUrl: "blob:foo",
          file: new File([], "p1.jpg"),
          status: "ready" as const,
          uploadedPath: "users/uid-1/staging/sess-12345/photos/aaaa1111.jpg",
        },
        {
          id: "2",
          name: "p2.jpg",
          previewUrl: "blob:bar",
          file: new File([], "p2.jpg"),
          // Still uploading — must be filtered out.
          status: "uploading" as const,
        },
      ],
    },
    attributes: {
      ethnicity: "Trigueñas",
      hair: "Pelinegras",
      height: "Altas",
      body: "Delgadas",
      breastSize: "Medianos",
      breastType: "Naturales",
      pubis: "Depiladas",
      country: "Colombianas",
      languages: ["Español"] as const,
    },
    publish: {
      packageId: "premium" as const,
      addOnIds: ["seo-pack" as const],
      billing: "quarterly" as const,
      acceptsTerms: true,
      acceptsAdult: true,
    },
  };
}

describe("toServerPayload", () => {
  it("forwards the sessionId verbatim", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.sessionId).toBe("sess-12345");
  });

  it("trims string fields", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.details.displayName).toBe("Alma");
    expect(out.payload.description.shortBio).toBe("short");
  });

  it("coerces numeric strings to numbers", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.details.age).toBe(24);
    expect(out.payload.details.pricePerHour).toBe(200_000);
  });

  it("only emits gallery entries with an uploadedPath", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.description.gallery).toHaveLength(1);
    expect(out.payload.description.gallery[0]).toEqual({
      path: "users/uid-1/staging/sess-12345/photos/aaaa1111.jpg",
    });
  });

  it("emits ready photos in the same order as the draft", () => {
    const draft = fullDraft();
    draft.description.gallery = [
      {
        id: "a",
        name: "a.jpg",
        previewUrl: "blob:a",
        file: new File([], "a.jpg"),
        status: "ready",
        uploadedPath: "users/uid-1/staging/sess-12345/photos/aaaa.jpg",
      },
      {
        id: "b",
        name: "b.jpg",
        previewUrl: "blob:b",
        file: new File([], "b.jpg"),
        status: "ready",
        uploadedPath: "users/uid-1/staging/sess-12345/photos/bbbb.jpg",
      },
    ];
    const out = toServerPayload(draft, "sess-12345");
    expect(out.payload.description.gallery.map((g) => g.path)).toEqual([
      "users/uid-1/staging/sess-12345/photos/aaaa.jpg",
      "users/uid-1/staging/sess-12345/photos/bbbb.jpg",
    ]);
  });

  it("locks publish values to MVP-free when PLANS_ENABLED is false", () => {
    if (PLANS_ENABLED) {
      // Skip semantics: when plans are enabled the lock is intentionally
      // bypassed. The other tests in this file cover the enabled case.
      return;
    }
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.publish.packageId).toBe("esencial");
    expect(out.payload.publish.addOnIds).toEqual([]);
    expect(out.payload.publish.billing).toBe("monthly");
  });

  it("preserves acceptsTerms / acceptsAdult even in MVP-free mode", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.publish.acceptsTerms).toBe(true);
    expect(out.payload.publish.acceptsAdult).toBe(true);
  });

  it("forwards appearance attributes verbatim", () => {
    const out = toServerPayload(fullDraft(), "sess-12345");
    expect(out.payload.attributes).toEqual({
      ethnicity: "Trigueñas",
      hair: "Pelinegras",
      height: "Altas",
      body: "Delgadas",
      breastSize: "Medianos",
      breastType: "Naturales",
      pubis: "Depiladas",
      country: "Colombianas",
      languages: ["Español"],
    });
  });

  it("collapses empty pubis to undefined so Firestore does not persist an empty string", () => {
    const draft = fullDraft();
    draft.attributes = { ...draft.attributes, pubis: "" };
    const out = toServerPayload(draft, "sess-12345");
    expect(out.payload.attributes.pubis).toBeUndefined();
  });
});
