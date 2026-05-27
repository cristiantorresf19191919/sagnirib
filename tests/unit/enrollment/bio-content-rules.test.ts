import { describe, expect, it } from "vitest";

import { containsUrl } from "@/features/enrollment/lib/bio-content-rules";

describe("containsUrl", () => {
  describe("protocol-based URLs", () => {
    it("detects http://", () => {
      expect(containsUrl("visítame en http://example.com")).toBe(true);
    });

    it("detects https://", () => {
      expect(containsUrl("más info en https://example.com")).toBe(true);
    });

    it("detects ftp://", () => {
      expect(containsUrl("archivos en ftp://files.example.com")).toBe(true);
    });

    it("is case-insensitive for protocol", () => {
      expect(containsUrl("HTTP://example.com")).toBe(true);
      expect(containsUrl("HTTPS://example.com")).toBe(true);
    });
  });

  describe("www. prefix", () => {
    it("detects www. prefix", () => {
      expect(containsUrl("escríbeme en www.example.com")).toBe(true);
    });

    it("detects www. mid-sentence", () => {
      expect(containsUrl("mi sitio www.mipagina.com para más info")).toBe(true);
    });

    it("does not flag a word boundary-free 'www' substring", () => {
      // "www" must appear as a standalone \bwww\. — not just the letters
      expect(containsUrl("keywords contain www but no dot")).toBe(false);
    });
  });

  describe("known platform hostnames", () => {
    const platforms = [
      "t.me/usuario",
      "wa.me/573001234567",
      "instagram.com/usuario",
      "onlyfans.com/usuario",
      "twitter.com/usuario",
      "x.com/usuario",
      "tiktok.com/usuario",
      "facebook.com/usuario",
      "telegram.me/usuario",
      "snapchat.com/usuario",
      "linkedin.com/usuario",
      "youtube.com/watch",
      "youtu.be/abcdef",
    ];

    it.each(platforms)("detects %s", (platform) => {
      expect(containsUrl(`contáctame en ${platform}`)).toBe(true);
    });

    it("is case-insensitive for platform names", () => {
      expect(containsUrl("sígueme en Instagram.com/yo")).toBe(true);
      expect(containsUrl("TIKTOK.COM/yo")).toBe(true);
    });
  });

  describe("clean text — no URL", () => {
    it("returns false for plain biographical text", () => {
      expect(
        containsUrl(
          "Soy una chica alegre y divertida. Me gusta la música y el deporte.",
        ),
      ).toBe(false);
    });

    it("returns false for an empty string", () => {
      expect(containsUrl("")).toBe(false);
    });

    it("returns false for a phone number", () => {
      expect(containsUrl("+57 300 123 4567")).toBe(false);
    });

    it("returns false for partial platform names without TLD", () => {
      expect(containsUrl("me llaman instagram por mis fotos")).toBe(false);
      expect(containsUrl("uso tiktok mucho")).toBe(false);
    });

    it("returns false for email addresses", () => {
      // Emails are not in scope for this rule
      expect(containsUrl("escríbeme a correo@example.com")).toBe(false);
    });
  });
});
