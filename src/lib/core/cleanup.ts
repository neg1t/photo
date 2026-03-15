import type { CollectionStatus } from "@/lib/core/collections";

type CleanupPhoto = {
  storageKey: string;
  previewKey: string;
  sizeBytes: bigint;
};

type CleanupArchive = {
  storageKey: string;
  sizeBytes: bigint;
};

type CleanupCollection = {
  status: CollectionStatus;
  expiresAt: Date;
  storageDeletedAt: Date | null;
  photos: CleanupPhoto[];
  archive: CleanupArchive | null;
};

export function buildCollectionCleanupPlan(collection: CleanupCollection) {
  if (collection.storageDeletedAt) {
    return null;
  }

  const keysToDelete = collection.photos.flatMap((photo) => [
    photo.storageKey,
    photo.previewKey,
  ]);
  const releasableBytes = collection.photos.reduce(
    (sum, photo) => sum + photo.sizeBytes,
    0n,
  );

  if (collection.archive) {
    keysToDelete.push(collection.archive.storageKey);
  }

  return {
    keysToDelete,
    releasableBytes,
    statusAfterCleanup: "DELETED" as const,
  };
}
