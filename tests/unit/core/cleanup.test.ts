import { describe, expect, it } from "vitest";

import { buildCollectionCleanupPlan } from "@/lib/core/cleanup";

describe("buildCollectionCleanupPlan", () => {
  it("collects all storage keys and bytes to release for an expired collection", () => {
    const plan = buildCollectionCleanupPlan({
      status: "PUBLISHED",
      expiresAt: new Date("2026-03-10T00:00:00.000Z"),
      storageDeletedAt: null,
      photos: [
        {
          storageKey: "users/u1/collections/c1/originals/1.jpg",
          previewKey: "users/u1/collections/c1/previews/1.webp",
          sizeBytes: 2_000n,
        },
        {
          storageKey: "users/u1/collections/c1/originals/2.jpg",
          previewKey: "users/u1/collections/c1/previews/2.webp",
          sizeBytes: 3_500n,
        },
      ],
      archive: {
        storageKey: "users/u1/collections/c1/archives/latest.zip",
        sizeBytes: 1_200n,
      },
    });

    expect(plan).toEqual({
      releasableBytes: 5_500n,
      statusAfterCleanup: "DELETED",
      keysToDelete: [
        "users/u1/collections/c1/originals/1.jpg",
        "users/u1/collections/c1/previews/1.webp",
        "users/u1/collections/c1/originals/2.jpg",
        "users/u1/collections/c1/previews/2.webp",
        "users/u1/collections/c1/archives/latest.zip",
      ],
    });
  });

  it("returns null when storage was already deleted", () => {
    const plan = buildCollectionCleanupPlan({
      status: "DELETED",
      expiresAt: new Date("2026-03-10T00:00:00.000Z"),
      storageDeletedAt: new Date("2026-03-11T00:00:00.000Z"),
      photos: [],
      archive: null,
    });

    expect(plan).toBeNull();
  });
});
