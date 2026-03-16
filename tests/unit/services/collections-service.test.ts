import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getStorageObjectMock,
  putStorageObjectMock,
  createZipArchiveMock,
} = vi.hoisted(() => ({
  prismaMock: {
    collection: {
      findFirst: vi.fn(),
    },
    collectionArchive: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
  getStorageObjectMock: vi.fn(),
  putStorageObjectMock: vi.fn(),
  createZipArchiveMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/storage/s3", () => ({
  createSignedUploadUrl: vi.fn(),
  deleteStorageObjects: vi.fn(),
  getStorageObject: getStorageObjectMock,
  putStorageObject: putStorageObjectMock,
}));

vi.mock("@/lib/zip", () => ({
  createZipArchive: createZipArchiveMock,
}));

import { getOrCreateArchiveForCollection } from "@/lib/services/collections-service";

describe("getOrCreateArchiveForCollection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:30:00.000Z"));
    vi.clearAllMocks();
    getStorageObjectMock.mockResolvedValue({
      bytes: Uint8Array.from([1, 2, 3]),
      contentLength: 3,
      contentType: "image/jpeg",
    });
    putStorageObjectMock.mockResolvedValue(undefined);
    createZipArchiveMock.mockResolvedValue(Buffer.from("zip"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reuses a fresh archive when the collection has not changed since it was created", async () => {
    prismaMock.collection.findFirst.mockResolvedValue({
      id: "collection-1",
      userId: "user-1",
      title: "Wedding",
      status: "PUBLISHED",
      shareToken: "token-1",
      publishedAt: new Date("2026-03-15T09:00:00.000Z"),
      expiresAt: new Date("2026-03-20T09:00:00.000Z"),
      updatedAt: new Date("2026-03-15T09:00:00.000Z"),
      photos: [
        {
          id: "photo-1",
          storageKey: "users/user-1/collections/collection-1/originals/photo-1.jpg",
          originalName: "photo-1.jpg",
        },
      ],
      user: {
        profile: null,
      },
    });
    prismaMock.collectionArchive.findUnique.mockResolvedValue({
      collectionId: "collection-1",
      storageKey: "users/user-1/collections/collection-1/archives/latest.zip",
      sizeBytes: 123n,
      expiresAt: new Date("2026-03-16T11:00:00.000Z"),
      updatedAt: new Date("2026-03-15T10:00:00.000Z"),
    });

    const archive = await getOrCreateArchiveForCollection("token-1");

    expect(archive).toEqual({
      storageKey: "users/user-1/collections/collection-1/archives/latest.zip",
      fileName: "Wedding.zip",
    });
    expect(createZipArchiveMock).not.toHaveBeenCalled();
    expect(putStorageObjectMock).not.toHaveBeenCalled();
  });

  it("rebuilds the archive when the collection changed after the previous archive was created", async () => {
    prismaMock.collection.findFirst.mockResolvedValue({
      id: "collection-1",
      userId: "user-1",
      title: "Wedding",
      status: "PUBLISHED",
      shareToken: "token-1",
      publishedAt: new Date("2026-03-15T09:00:00.000Z"),
      expiresAt: new Date("2026-03-20T09:00:00.000Z"),
      updatedAt: new Date("2026-03-15T10:15:00.000Z"),
      photos: [
        {
          id: "photo-1",
          storageKey: "users/user-1/collections/collection-1/originals/photo-1.jpg",
          originalName: "photo-1.jpg",
        },
      ],
      user: {
        profile: null,
      },
    });
    prismaMock.collectionArchive.findUnique.mockResolvedValue({
      collectionId: "collection-1",
      storageKey: "users/user-1/collections/collection-1/archives/latest.zip",
      sizeBytes: 123n,
      expiresAt: new Date("2026-03-16T11:00:00.000Z"),
      updatedAt: new Date("2026-03-15T10:00:00.000Z"),
    });

    const archive = await getOrCreateArchiveForCollection("token-1");

    expect(createZipArchiveMock).toHaveBeenCalledTimes(1);
    expect(putStorageObjectMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.collectionArchive.upsert).toHaveBeenCalledTimes(1);
    expect(archive).toEqual({
      storageKey: "users/user-1/collections/collection-1/archives/latest.zip",
      fileName: "Wedding.zip",
    });
  });
});
