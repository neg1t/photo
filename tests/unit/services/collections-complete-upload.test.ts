import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getStorageObjectMock,
  headStorageObjectMock,
  putStorageObjectMock,
} = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    photo: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getStorageObjectMock: vi.fn(),
  headStorageObjectMock: vi.fn(),
  putStorageObjectMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/storage/s3", () => ({
  createSignedUploadUrl: vi.fn(),
  deleteStorageObjects: vi.fn(),
  getStorageObject: getStorageObjectMock,
  headStorageObject: headStorageObjectMock,
  putStorageObject: putStorageObjectMock,
}));

import { completeCollectionPhotoUploads } from "@/lib/services/collections-service";

describe("completeCollectionPhotoUploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      accessStatus: "ACTIVE",
      storageUsedBytes: 10n,
      storageLimitBytes: 1_000_000_000n,
    });
    prismaMock.collection.findFirst.mockResolvedValue({
      id: "collection-1",
      userId: "user-1",
      storageDeletedAt: null,
    });
    prismaMock.user.update.mockReturnValue({ kind: "user-update" });
    prismaMock.collection.update.mockReturnValue({ kind: "collection-update" });
    prismaMock.photo.createMany.mockReturnValue({ kind: "photo-create-many" });
    prismaMock.$transaction.mockResolvedValue([]);
    headStorageObjectMock.mockResolvedValue({
      contentLength: 6_000_000,
      contentType: "image/heic",
    });
  });

  it("persists pending rows without building previews inline", async () => {
    await completeCollectionPhotoUploads({
      userId: "user-1",
      collectionId: "collection-1",
      uploads: [
        {
          uploadId: "upload-1",
          fileName: "wedding.heic",
          mimeType: "image/heic",
          sizeBytes: 5_500_000,
        },
      ],
    });

    expect(headStorageObjectMock).toHaveBeenCalledTimes(1);
    expect(getStorageObjectMock).not.toHaveBeenCalled();
    expect(putStorageObjectMock).not.toHaveBeenCalled();
    expect(prismaMock.photo.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: "upload-1",
          collectionId: "collection-1",
          originalName: "wedding.heic",
          mimeType: "image/heic",
          sizeBytes: 6_000_000n,
          processingStatus: "PENDING",
          previewKey: null,
          width: null,
          height: null,
        }),
      ],
    });
  });
});
