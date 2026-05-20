import { describe, expect, it } from "vitest";

import {
  confirmKycUploadSchema,
  kycUploadTicketSchema,
  submitVerificationSchema,
} from "@/server/verification/schemas";

describe("kycUploadTicketSchema", () => {
  const VALID = {
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
  it("accepts a well-formed path", () => {
    const out = confirmKycUploadSchema.parse({
      path: "verifications/abc-123/document_front.jpg",
    });
    expect(out.path).toBe("verifications/abc-123/document_front.jpg");
  });

  it("rejects missing path", () => {
    expect(() => confirmKycUploadSchema.parse({})).toThrow();
  });
});

describe("submitVerificationSchema", () => {
  const VALID = {
    documentFrontPath: "verifications/UAIBazitt/document_front.jpg",
    documentBackPath: "verifications/UAIBazitt/document_back.jpg",
    selfiePath: "verifications/UAIBazitt/selfie.jpg",
  };

  it("accepts three matching paths", () => {
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

  it("rejects when paths mix different uids", () => {
    expect(() =>
      submitVerificationSchema.parse({
        ...VALID,
        documentBackPath: "verifications/OtherUid/document_back.jpg",
      }),
    ).toThrow(/same user/);
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
});
