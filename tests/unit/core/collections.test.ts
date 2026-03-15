import { describe, expect, it } from "vitest";

import {
  getCollectionPublicState,
  publishCollection,
} from "@/lib/core/collections";

describe("publishCollection", () => {
  it("publishes a draft collection and assigns a share token", () => {
    const now = new Date("2026-03-14T12:00:00.000Z");

    const published = publishCollection(
      {
        id: "col-1",
        status: "DRAFT",
        expiresAt: new Date("2026-04-13T12:00:00.000Z"),
        shareToken: null,
        publishedAt: null,
      },
      () => "share-token-123",
      now,
    );

    expect(published.status).toBe("PUBLISHED");
    expect(published.shareToken).toBe("share-token-123");
    expect(published.publishedAt).toEqual(now);
  });
});

describe("getCollectionPublicState", () => {
  it("returns expired when a published collection is past its retention date", () => {
    const state = getCollectionPublicState(
      {
        status: "PUBLISHED",
        expiresAt: new Date("2026-03-14T12:00:00.000Z"),
      },
      new Date("2026-03-15T12:00:00.000Z"),
    );

    expect(state).toBe("expired");
  });

  it("returns hidden for draft collections", () => {
    const state = getCollectionPublicState(
      {
        status: "DRAFT",
        expiresAt: new Date("2026-03-20T12:00:00.000Z"),
      },
      new Date("2026-03-15T12:00:00.000Z"),
    );

    expect(state).toBe("hidden");
  });
});
