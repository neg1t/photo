import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  deleteStorageObjectsMock,
  putStorageObjectMock,
  downloadStorageObjectToFileMock,
  buildPreviewFromFileMock,
  treatAsOriginalOnlyMock,
} = vi.hoisted(() => ({
  prismaMock: {
    photo: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    collection: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  deleteStorageObjectsMock: vi.fn(),
  putStorageObjectMock: vi.fn(),
  downloadStorageObjectToFileMock: vi.fn(),
  buildPreviewFromFileMock: vi.fn(),
  treatAsOriginalOnlyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/storage/s3", () => ({
  deleteStorageObjects: deleteStorageObjectsMock,
  downloadStorageObjectToFile: downloadStorageObjectToFileMock,
  putStorageObject: putStorageObjectMock,
}));

vi.mock("@/lib/media", () => ({
  buildPreviewFromFile: buildPreviewFromFileMock,
}));

vi.mock("@/lib/media-upload", () => ({
  buildPhotoFileInputAccept: vi.fn(),
  getPreferredUploadContentType: vi.fn(),
  isAcceptedPhotoUpload: vi.fn(),
  shouldTreatPreviewFailureAsOriginalOnly: treatAsOriginalOnlyMock,
}));

import { processPendingPhotoById } from "@/lib/services/media-processing-service";

describe("processPendingPhotoById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.photo.update.mockResolvedValue(undefined);
    prismaMock.user.update.mockReturnValue({ kind: "user-update" });
    prismaMock.collection.update.mockReturnValue({ kind: "collection-update" });
    prismaMock.$transaction.mockResolvedValue([]);
    downloadStorageObjectToFileMock.mockResolvedValue("C:/temp/photo-1");
  });

  it("marks a pending raw photo as ORIGINAL_ONLY when preview generation is not supported", async () => {
    prismaMock.photo.findUnique.mockResolvedValue({
      id: "photo-1",
      storageKey: "users/user-1/collections/collection-1/originals/photo-1.cr3",
      previewKey: null,
      originalName: "photo-1.cr3",
      mimeType: "application/octet-stream",
      sizeBytes: 10_000_000n,
      processingStatus: "PENDING",
      collectionId: "collection-1",
      collection: {
        userId: "user-1",
      },
    });
    buildPreviewFromFileMock.mockRejectedValue(new Error("unsupported"));
    treatAsOriginalOnlyMock.mockReturnValue(true);

    await processPendingPhotoById("photo-1");

    expect(putStorageObjectMock).not.toHaveBeenCalled();
    expect(deleteStorageObjectsMock).not.toHaveBeenCalled();
    expect(prismaMock.photo.update).toHaveBeenCalledWith({
      where: { id: "photo-1" },
      data: expect.objectContaining({
        processingStatus: "ORIGINAL_ONLY",
        previewKey: null,
        width: null,
        height: null,
        processingError: null,
      }),
    });
  });

  it("marks a broken jpeg as FAILED and releases reserved quota", async () => {
    prismaMock.photo.findUnique.mockResolvedValue({
      id: "photo-2",
      storageKey: "users/user-1/collections/collection-1/originals/photo-2.jpg",
      previewKey: null,
      originalName: "photo-2.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 5_000_000n,
      processingStatus: "PENDING",
      collectionId: "collection-1",
      collection: {
        userId: "user-1",
      },
    });
    buildPreviewFromFileMock.mockRejectedValue(new Error("corrupt"));
    treatAsOriginalOnlyMock.mockReturnValue(false);

    await processPendingPhotoById("photo-2");

    expect(deleteStorageObjectsMock).toHaveBeenCalledWith([
      "users/user-1/collections/collection-1/originals/photo-2.jpg",
    ]);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.photo.update).toHaveBeenCalledWith({
      where: { id: "photo-2" },
      data: expect.objectContaining({
        processingStatus: "FAILED",
        sizeBytes: 0n,
        previewKey: null,
      }),
    });
  });
});
