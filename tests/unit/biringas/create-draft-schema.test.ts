import { describe, expect, it } from "vitest";

import { createListingDraftSchema } from "@/server/biringas/create-draft-schema";

function baseInput() {
  return {
    sessionId: "sess-abc12345",
    payload: {
      details: {
        displayName: "Alma",
        age: 24,
        city: "Medellín",
        category: "prepagos",
        phone: "+57 300 1234567",
        preferredSlug: "alma-medellin",
        pricePerHour: 200_000,
        attention: ["hombres"],
        contactChannels: ["whatsapp"],
      },
      description: {
        shortBio: "Una frase corta.",
        bio: "Una descripción larga sobre la persona, lo que ofrece, su estilo, suficiente para superar los 60 caracteres mínimos exigidos por el schema.",
        services: ["Compañía"],
        meetingContexts: ["Hotel"],
        faceVisible: true,
        paymentByCard: false,
        availableNow: false,
        gallery: [],
      },
      attributes: {
        ethnicity: "Trigueñas",
        hair: "Pelinegras",
        height: "Altas",
        body: "Delgadas",
        breastSize: "Medianos",
        breastType: "Naturales",
        country: "Colombianas",
        languages: ["Español"],
      },
      publish: {
        packageId: "esencial",
        addOnIds: [],
        billing: "monthly",
        acceptsTerms: true,
        acceptsAdult: true,
      },
    },
  };
}

describe("createListingDraftSchema.parse", () => {
  it("accepts a minimal valid input with no photos", () => {
    expect(() => createListingDraftSchema.parse(baseInput())).not.toThrow();
  });

  it("requires sessionId", () => {
    const input = baseInput() as Record<string, unknown>;
    delete input.sessionId;
    expect(() => createListingDraftSchema.parse(input)).toThrow(/sessionId/);
  });

  it("rejects sessionId with disallowed characters", () => {
    const input = baseInput();
    input.sessionId = "sess/with/slash";
    expect(() => createListingDraftSchema.parse(input)).toThrow(/sessionId/);
  });

  it("rejects gallery items that are not staging-shaped paths", () => {
    const input = baseInput();
    input.payload.description.gallery = [
      { path: "listing_drafts/abc/photos/deadbeef.jpg" },
    ] as never;
    expect(() => createListingDraftSchema.parse(input)).toThrow(
      /not a valid staging photo path/,
    );
  });

  it("rejects gallery items with disallowed extensions", () => {
    const input = baseInput();
    input.payload.description.gallery = [
      { path: "users/abc123/staging/sess-12345/photos/deadbeef.gif" },
    ] as never;
    expect(() => createListingDraftSchema.parse(input)).toThrow(
      /not a valid staging photo path/,
    );
  });

  it("rejects duplicate gallery paths", () => {
    const input = baseInput();
    const dup = "users/abc123/staging/sess-12345/photos/deadbeefdeadbeef.jpg";
    input.payload.description.gallery = [{ path: dup }, { path: dup }] as never;
    expect(() => createListingDraftSchema.parse(input)).toThrow(/duplicate/);
  });

  it("accepts up to galleryMax photos", () => {
    const input = baseInput();
    input.payload.description.gallery = Array.from({ length: 24 }, (_, i) => ({
      path: `users/abc123/staging/sess-12345/photos/${i.toString(16).padStart(8, "0")}aaaa.jpg`,
    })) as never;
    expect(() => createListingDraftSchema.parse(input)).not.toThrow();
  });

  it("rejects when terms or adult are unchecked", () => {
    const input = baseInput();
    input.payload.publish.acceptsTerms = false;
    expect(() => createListingDraftSchema.parse(input)).toThrow(/accept terms/);
  });

  it("rejects underage age values", () => {
    const input = baseInput();
    input.payload.details.age = 17;
    expect(() => createListingDraftSchema.parse(input)).toThrow(/age/);
  });

  it("rejects empty category", () => {
    const input = baseInput();
    (input.payload.details as unknown as { category: string }).category = "";
    expect(() => createListingDraftSchema.parse(input)).toThrow(/category/);
  });

  it("rejects bio shorter than 60 characters", () => {
    const input = baseInput();
    input.payload.description.bio = "muy corto";
    expect(() => createListingDraftSchema.parse(input)).toThrow(/bio/);
  });

  it("rejects appearance attributes outside the APPEARANCE_CATALOG enum", () => {
    const input = baseInput();
    (
      input.payload.attributes as unknown as { ethnicity: string }
    ).ethnicity = "Marciana";
    expect(() => createListingDraftSchema.parse(input)).toThrow(
      /attributes\.ethnicity/,
    );
  });

  it("requires the six core appearance fields", () => {
    const input = baseInput();
    (input.payload.attributes as unknown as { country: string }).country = "";
    expect(() => createListingDraftSchema.parse(input)).toThrow(
      /attributes\.country/,
    );
  });

  it("treats pubis as optional", () => {
    const input = baseInput();
    delete (input.payload.attributes as unknown as { pubis?: string }).pubis;
    expect(() => createListingDraftSchema.parse(input)).not.toThrow();
  });

  it("forwards the parsed attributes shape verbatim on a clean parse", () => {
    const parsed = createListingDraftSchema.parse(baseInput());
    expect(parsed.payload.attributes).toEqual({
      ethnicity: "Trigueñas",
      hair: "Pelinegras",
      height: "Altas",
      body: "Delgadas",
      breastSize: "Medianos",
      breastType: "Naturales",
      country: "Colombianas",
      languages: ["Español"],
      pubis: undefined,
    });
  });
});
