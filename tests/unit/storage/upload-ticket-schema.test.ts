import { describe, expect, it } from "vitest";

import {
  confirmUploadSchema,
  uploadTicketSchema,
} from "@/server/storage/upload-ticket-schema";

const VALID_INPUT = {
  kind: "photo",
  sessionId: "abc12345xyz",
  contentType: "image/jpeg",
  sizeBytes: 250_000,
};

describe("uploadTicketSchema.parse", () => {
  it("accepts a well-formed photo input", () => {
    expect(uploadTicketSchema.parse(VALID_INPUT)).toEqual(VALID_INPUT);
  });

  it("rejects non-object input", () => {
    expect(() => uploadTicketSchema.parse(null)).toThrow();
    expect(() => uploadTicketSchema.parse("abc")).toThrow();
  });

  it("rejects unknown kinds", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, kind: "video" }),
    ).toThrow(/kind must be one of/);
  });

  it("rejects sessionId with invalid characters", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, sessionId: "abc/with/slash" }),
    ).toThrow(/sessionId/);
  });

  it("rejects sessionId shorter than 8 chars", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, sessionId: "short" }),
    ).toThrow(/sessionId/);
  });

  it("rejects MIME types outside the allowlist", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, contentType: "image/png" }),
    ).toThrow(/contentType must be one of/);
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, contentType: "video/mp4" }),
    ).toThrow(/contentType must be one of/);
  });

  it("rejects sizes above the 4MB cap", () => {
    expect(() =>
      uploadTicketSchema.parse({
        ...VALID_INPUT,
        sizeBytes: 5 * 1024 * 1024,
      }),
    ).toThrow(/sizeBytes/);
  });

  it("rejects suspiciously tiny photos (< 4KB)", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, sizeBytes: 100 }),
    ).toThrow(/sizeBytes/);
  });

  it("rejects non-integer sizes", () => {
    expect(() =>
      uploadTicketSchema.parse({ ...VALID_INPUT, sizeBytes: 100.5 }),
    ).toThrow(/sizeBytes/);
  });

  it("accepts image/webp as well as image/jpeg", () => {
    const out = uploadTicketSchema.parse({
      ...VALID_INPUT,
      contentType: "image/webp",
    });
    expect(out.contentType).toBe("image/webp");
  });
});

describe("confirmUploadSchema.parse", () => {
  it("accepts a well-formed path", () => {
    const out = confirmUploadSchema.parse({
      path: "users/abc123/staging/sess-12345/photos/deadbeef.jpg",
    });
    expect(out.path).toMatch(/^users\//);
  });

  it("rejects empty or missing path", () => {
    expect(() => confirmUploadSchema.parse({ path: "" })).toThrow();
    expect(() => confirmUploadSchema.parse({})).toThrow();
  });

  it("trims whitespace around path", () => {
    const out = confirmUploadSchema.parse({
      path: "  users/abc123/staging/sess-12345/photos/deadbeef.jpg  ",
    });
    expect(out.path.startsWith(" ")).toBe(false);
    expect(out.path.endsWith(" ")).toBe(false);
  });
});
