import { prisma } from "@/lib/db";
import { buildCollectionCleanupPlan } from "@/lib/core/cleanup";
import { deleteStorageObjects } from "@/lib/storage/s3";

export async function runCleanupJob() {
  const now = new Date();
  const expiredCollections = await prisma.collection.findMany({
    where: {
      expiresAt: { lte: now },
      storageDeletedAt: null,
    },
    include: {
      photos: true,
      archive: true,
      user: {
        select: {
          id: true,
          storageUsedBytes: true,
        },
      },
    },
  });

  let cleanedCollections = 0;

  for (const collection of expiredCollections) {
    const cleanupPlan = buildCollectionCleanupPlan({
      status: collection.status,
      expiresAt: collection.expiresAt,
      storageDeletedAt: collection.storageDeletedAt,
      photos: collection.photos.map((photo) => ({
        storageKey: photo.storageKey,
        previewKey: photo.previewKey,
        sizeBytes: photo.sizeBytes,
      })),
      archive: collection.archive
        ? {
            storageKey: collection.archive.storageKey,
            sizeBytes: collection.archive.sizeBytes,
          }
        : null,
    });

    if (!cleanupPlan) {
      continue;
    }

    await deleteStorageObjects(cleanupPlan.keysToDelete);
    const nextUsage =
      collection.user.storageUsedBytes > cleanupPlan.releasableBytes
        ? collection.user.storageUsedBytes - cleanupPlan.releasableBytes
        : 0n;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: collection.user.id },
        data: {
          storageUsedBytes: nextUsage,
        },
      }),
      prisma.collection.update({
        where: { id: collection.id },
        data: {
          status: cleanupPlan.statusAfterCleanup,
          storageDeletedAt: now,
        },
      }),
      prisma.collectionArchive.deleteMany({
        where: { collectionId: collection.id },
      }),
    ]);

    cleanedCollections += 1;
  }

  const expiredArchives = await prisma.collectionArchive.findMany({
    where: {
      expiresAt: { lte: now },
    },
  });

  if (expiredArchives.length) {
    await deleteStorageObjects(
      expiredArchives.map((archive) => archive.storageKey),
    );
    await prisma.collectionArchive.deleteMany({
      where: {
        id: {
          in: expiredArchives.map((archive) => archive.id),
        },
      },
    });
  }

  return {
    cleanedCollections,
    cleanedArchives: expiredArchives.length,
  };
}
