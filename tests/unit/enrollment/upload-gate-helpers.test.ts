import { describe, expect, it } from "vitest";

import {
  hasErroredUploads,
  hasErroredVideoUploads,
  hasInFlightUploads,
  hasInFlightVideoUploads,
} from "@/features/enrollment/components/StepDescription";
import type { GalleryItem, VideoItem } from "@/features/enrollment/lib/types";

// ---------------------------------------------------------------------------
// Minimal fixture builders — only fields the helpers actually read
// ---------------------------------------------------------------------------

function photo(status: GalleryItem["status"]): GalleryItem {
  return {
    id: "x",
    name: "photo.jpg",
    previewUrl: "blob:x",
    file: new File([], "photo.jpg"),
    status,
  };
}

function video(status: VideoItem["status"]): VideoItem {
  return {
    id: "v",
    name: "clip.mp4",
    previewUrl: "blob:v",
    file: new File([], "clip.mp4"),
    status,
  };
}

// ---------------------------------------------------------------------------
// hasInFlightUploads
// ---------------------------------------------------------------------------

describe("hasInFlightUploads", () => {
  it("returns false for an empty gallery", () => {
    expect(hasInFlightUploads([])).toBe(false);
  });

  it("returns true when any photo is queued", () => {
    expect(hasInFlightUploads([photo("queued")])).toBe(true);
  });

  it("returns true when any photo is compressing", () => {
    expect(hasInFlightUploads([photo("compressing")])).toBe(true);
  });

  it("returns true when any photo is uploading", () => {
    expect(hasInFlightUploads([photo("uploading")])).toBe(true);
  });

  it("returns false when all photos are ready", () => {
    expect(hasInFlightUploads([photo("ready"), photo("ready")])).toBe(false);
  });

  it("returns false when all photos have errored", () => {
    expect(hasInFlightUploads([photo("error")])).toBe(false);
  });

  it("returns true when at least one photo is in-flight alongside ready ones", () => {
    expect(
      hasInFlightUploads([photo("ready"), photo("uploading"), photo("ready")]),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasErroredUploads
// ---------------------------------------------------------------------------

describe("hasErroredUploads", () => {
  it("returns false for an empty gallery", () => {
    expect(hasErroredUploads([])).toBe(false);
  });

  it("returns true when any photo has errored", () => {
    expect(hasErroredUploads([photo("error")])).toBe(true);
  });

  it("returns false when all photos are ready", () => {
    expect(hasErroredUploads([photo("ready"), photo("ready")])).toBe(false);
  });

  it("returns false when a photo is still in-flight", () => {
    expect(hasErroredUploads([photo("uploading")])).toBe(false);
  });

  it("returns true when one errored photo is mixed with ready ones", () => {
    expect(
      hasErroredUploads([photo("ready"), photo("error"), photo("ready")]),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasInFlightVideoUploads
// ---------------------------------------------------------------------------

describe("hasInFlightVideoUploads", () => {
  it("returns false for an empty video list", () => {
    expect(hasInFlightVideoUploads([])).toBe(false);
  });

  it("returns true when any video is queued", () => {
    expect(hasInFlightVideoUploads([video("queued")])).toBe(true);
  });

  it("returns true when any video is validating", () => {
    expect(hasInFlightVideoUploads([video("validating")])).toBe(true);
  });

  it("returns true when any video is uploading", () => {
    expect(hasInFlightVideoUploads([video("uploading")])).toBe(true);
  });

  it("returns false when all videos are ready", () => {
    expect(hasInFlightVideoUploads([video("ready"), video("ready")])).toBe(false);
  });

  it("returns false when all videos have errored", () => {
    expect(hasInFlightVideoUploads([video("error")])).toBe(false);
  });

  it("returns true when one in-flight video is mixed with a ready one", () => {
    expect(hasInFlightVideoUploads([video("ready"), video("validating")])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasErroredVideoUploads
// ---------------------------------------------------------------------------

describe("hasErroredVideoUploads", () => {
  it("returns false for an empty video list", () => {
    expect(hasErroredVideoUploads([])).toBe(false);
  });

  it("returns true when any video has errored", () => {
    expect(hasErroredVideoUploads([video("error")])).toBe(true);
  });

  it("returns false when all videos are ready", () => {
    expect(hasErroredVideoUploads([video("ready"), video("ready")])).toBe(false);
  });

  it("returns false when a video is still in-flight", () => {
    expect(hasErroredVideoUploads([video("validating")])).toBe(false);
  });

  it("returns true when one errored video is mixed with a ready one", () => {
    expect(hasErroredVideoUploads([video("ready"), video("error")])).toBe(true);
  });
});
