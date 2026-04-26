import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";

describe("buildPageMetadata", () => {
  it("emits noindex when global indexing is disabled", () => {
    const metadata = buildPageMetadata({
      title: "Foundation",
      description: "Placeholder",
      path: "/",
      indexable: false,
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("builds a canonical URL relative to metadataBase", () => {
    const metadata = buildPageMetadata({
      title: "About",
      description: "x",
      path: "/about",
      indexable: true,
    });

    expect(metadata.alternates?.canonical).toMatch(/\/about$/);
    expect(metadata.openGraph?.title).toBe("About");
  });
});
