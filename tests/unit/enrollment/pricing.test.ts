import { describe, expect, it } from "vitest";

import {
  GALLERY_MAX_BY_PACKAGE,
  GALLERY_MAX_MVP_FREE,
  PLANS_ENABLED,
  calculateTotal,
  galleryMaxFor,
} from "@/features/enrollment/lib/pricing";

describe("galleryMaxFor", () => {
  it("returns the MVP-free cap when plans are disabled", () => {
    if (!PLANS_ENABLED) {
      expect(galleryMaxFor("esencial")).toBe(GALLERY_MAX_MVP_FREE);
      expect(galleryMaxFor("destacada")).toBe(GALLERY_MAX_MVP_FREE);
      expect(galleryMaxFor("premium")).toBe(GALLERY_MAX_MVP_FREE);
    }
  });

  it("returns per-plan caps when plans are enabled", () => {
    if (PLANS_ENABLED) {
      expect(galleryMaxFor("esencial")).toBe(GALLERY_MAX_BY_PACKAGE.esencial);
      expect(galleryMaxFor("destacada")).toBe(GALLERY_MAX_BY_PACKAGE.destacada);
      expect(galleryMaxFor("premium")).toBe(GALLERY_MAX_BY_PACKAGE.premium);
    }
  });
});

describe("GALLERY_MAX_BY_PACKAGE", () => {
  it("stays within the server-side absolute ceiling (24)", () => {
    for (const [, cap] of Object.entries(GALLERY_MAX_BY_PACKAGE)) {
      expect(cap).toBeGreaterThan(0);
      expect(cap).toBeLessThanOrEqual(24);
    }
  });

  it("reflects the perk copy: esencial 3, destacada 8, premium 24", () => {
    expect(GALLERY_MAX_BY_PACKAGE.esencial).toBe(3);
    expect(GALLERY_MAX_BY_PACKAGE.destacada).toBe(8);
    expect(GALLERY_MAX_BY_PACKAGE.premium).toBe(24);
  });
});

describe("calculateTotal", () => {
  it("computes monthly esencial correctly", () => {
    const t = calculateTotal("esencial", [], "monthly");
    expect(t.totalCop).toBe(89_000);
    expect(t.effectiveMonthlyCop).toBe(89_000);
  });

  it("applies the quarterly discount", () => {
    const t = calculateTotal("destacada", [], "quarterly");
    // 189_000 * 3 * (1 - 0.15) = 482_000(.4) → 482_000 rounded
    expect(t.packageCop).toBe(Math.round(189_000 * 3 * 0.85));
    expect(t.totalCop).toBe(t.packageCop);
  });

  it("treats add-ons as flat one-shots", () => {
    const t = calculateTotal("esencial", ["seo-pack", "city-boost-24h"], "monthly");
    expect(t.addOnsCop).toBe(129_000 + 25_000);
  });
});
