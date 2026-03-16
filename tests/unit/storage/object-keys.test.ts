import { describe, expect, it } from "vitest";

import {
  buildCollectionArchiveKey,
  buildCollectionPhotoKeys,
  buildPortfolioAssetKeys,
} from "@/lib/storage/object-keys";

describe("storage object keys", () => {
  it("creates original and preview keys for collection photos", () => {
    const keys = buildCollectionPhotoKeys({
      userId: "user_1",
      collectionId: "collection_1",
      objectId: "photo_1",
      fileName: "Anna & Ivanov.jpg",
    });

    expect(keys).toEqual({
      originalKey:
        "users/user_1/collections/collection_1/originals/photo_1-anna-ivanov.jpg",
      previewKey:
        "users/user_1/collections/collection_1/previews/photo_1-preview.webp",
    });
  });

  it("creates portfolio storage keys in a dedicated namespace", () => {
    const keys = buildPortfolioAssetKeys({
      userId: "user_1",
      objectId: "asset_1",
      fileName: "Портрет.webp",
    });

    expect(keys).toEqual({
      originalKey: "users/user_1/portfolio/originals/asset_1-portret.webp",
      previewKey: "users/user_1/portfolio/previews/asset_1-preview.webp",
    });
  });

  it("creates a stable archive key for collection ZIPs", () => {
    expect(
      buildCollectionArchiveKey({
        userId: "user_1",
        collectionId: "collection_1",
      }),
    ).toBe("users/user_1/collections/collection_1/archives/latest.zip");
  });
});
