import { describe, expect, it } from "vitest";

import {
  confirmKycUploadSchema,
  kycUploadTicketSchema,
  submitVerificationSchema,
} from "@/server/verification/schemas";

describe("kycUploadTicketSchema", () => {
  const VALID = {
    personId: "UAIBazitt",
    kind: "document_front",
    contentType: "image/jpeg",
    sizeBytes: 250_000,
  };

  it("accepts a well-formed input", () => {
    expect(kycUploadTicketSchema.parse(VALID)).toEqual(VALID);
  });

  it("rejects non-object input", () => {
    expect(() => kycUploadTicketSchema.parse(null)).toThrow();
  });

  it("rejects missing personId", () => {
    const { personId: _omit, ...rest } = VALID;
    expect(() => kycUploadTicketSchema.parse(rest)).toThrow(/personId/);
  });

  it("rejects malformed personId", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, personId: "ab" }),
    ).toThrow(/personId/);
  });

  it("rejects unknown kinds", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, kind: "passport" }),
    ).toThrow(/kind/);
  });

  it("accepts each of the three valid kinds", () => {
    for (const kind of ["document_front", "document_back", "selfie"] as const) {
      expect(() =>
        kycUploadTicketSchema.parse({ ...VALID, kind }),
      ).not.toThrow();
    }
  });

  it("rejects MIME outside the allowlist", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, contentType: "image/png" }),
    ).toThrow(/contentType/);
  });

  it("accepts image/webp", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, contentType: "image/webp" }),
    ).not.toThrow();
  });

  it("rejects oversize files (>4MB)", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, sizeBytes: 5 * 1024 * 1024 }),
    ).toThrow(/sizeBytes/);
  });

  it("rejects empty files (<4KB)", () => {
    expect(() =>
      kycUploadTicketSchema.parse({ ...VALID, sizeBytes: 100 }),
    ).toThrow(/sizeBytes/);
  });
});

describe("confirmKycUploadSchema", () => {
  it("accepts a well-formed input", () => {
    const out = confirmKycUploadSchema.parse({
      personId: "abc-123",
      path: "verifications/abc-123/document_front.jpg",
    });
    expect(out.path).toBe("verifications/abc-123/document_front.jpg");
    expect(out.personId).toBe("abc-123");
  });

  it("rejects missing path", () => {
    expect(() =>
      confirmKycUploadSchema.parse({ personId: "abc-123" }),
    ).toThrow();
  });

  it("rejects missing personId", () => {
    expect(() =>
      confirmKycUploadSchema.parse({
        path: "verifications/abc-123/document_front.jpg",
      }),
    ).toThrow(/personId/);
  });
});

describe("submitVerificationSchema", () => {
  const VALID = {
    personId: "UAIBazitt",
    documentFrontPath: "verifications/UAIBazitt/document_front.jpg",
    documentBackPath: "verifications/UAIBazitt/document_back.jpg",
    selfiePath: "verifications/UAIBazitt/selfie.jpg",
    documentType: "CC",
    documentNumber: "1234567",
  };

  it("accepts three matching paths with valid identity", () => {
    expect(() => submitVerificationSchema.parse(VALID)).not.toThrow();
  });

  it("rejects when document_front path has wrong kind", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentFrontPath: "verifications/UAIBazitt/selfie.jpg",
      }),
    ).toThrow(/expected kind "document_front"/);
  });

  it("rejects when paths mix different personIds", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentBackPath: "verifications/OtherPid/document_back.jpg",
      }),
    ).toThrow(/same person/);
  });

  it("rejects when paths reference a different personId than the input", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentFrontPath: "verifications/OtherPid/document_front.jpg",
        documentBackPath: "verifications/OtherPid/document_back.jpg",
        selfiePath: "verifications/OtherPid/selfie.jpg",
      }),
    ).toThrow(/personId/);
  });

  it("rejects unknown extensions", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentFrontPath: "verifications/UAIBazitt/document_front.png",
      }),
    ).toThrow(/not a valid verification path/);
  });

  it("rejects malformed paths", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        selfiePath: "users/UAIBazitt/staging/x/photos/abc.jpg",
      }),
    ).toThrow(/not a valid verification path/);
  });

  it("rejects unknown documentType", () => {
    expect(() =>
      submitVerificationSchema.parse({ ...VALID, documentType: "DNI" }),
    ).toThrow(/documentType/);
  });

  it("accepts CC, CE and PASSPORT document types", () => {
    for (const type of ["CC", "CE", "PASSPORT"] as const) {
      expect(() =>
        submitVerificationSchema.parse({ ...VALID, documentType: type }),
      ).not.toThrow();
    }
  });

  it("normalizes documentNumber by stripping separators and uppercasing", () => {
    const out = submitVerificationSchema.parse({
      ...VALID,
      documentType: "PASSPORT",
      documentNumber: " ab-123.456 ",
    });
    expect(out.documentNumber).toBe("AB123456");
  });

  it("rejects documentNumber that is too short after normalization", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentNumber: "1.2",
      }),
    ).toThrow(/documentNumber/);
  });

  it("rejects documentNumber that is too long after normalization", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentNumber: "1".repeat(25),
      }),
    ).toThrow(/documentNumber/);
  });
});
