import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { prisma } from "@/lib/db";
import { buildPreviewFromFile } from "@/lib/media";
import { shouldTreatPreviewFailureAsOriginalOnly } from "@/lib/media-upload";
import {
  buildCollectionPhotoKeys,
  buildPortfolioAssetKeys,
} from "@/lib/storage/object-keys";
import {
  deleteStorageObjects,
  downloadStorageObjectToFile,
  putStorageObject,
} from "@/lib/storage/s3";

function getCollectionPreviewKey(input: {
  userId: string;
  collectionId: string;
  photoId: string;
  fileName: string;
}) {
  return buildCollectionPhotoKeys({
    userId: input.userId,
    collectionId: input.collectionId,
    objectId: input.photoId,
    fileName: input.fileName,
  }).previewKey;
}

function getPortfolioPreviewKey(input: {
  userId: string;
  assetId: string;
  fileName: string;
}) {
  return buildPortfolioAssetKeys({
    userId: input.userId,
    objectId: input.assetId,
    fileName: input.fileName,
  }).previewKey;
}

async function withTempFile<T>(
  prefix: string,
  callback: (filePath: string) => Promise<T>,
) {
  const tempDirectory = await mkdtemp(join(tmpdir(), prefix));
  const filePath = join(tempDirectory, "source");

  try {
    return await callback(filePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function processPendingPhotoById(photoId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      collection: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (
    !photo ||
    (photo.processingStatus !== "PENDING" && photo.processingStatus !== "PROCESSING")
  ) {
    return null;
  }

  if (!photo.collection) {
    return null;
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: {
      processingStatus: "PROCESSING",
      processingStartedAt: new Date(),
      processingError: null,
    },
  });

  return withTempFile("photo-worker-", async (filePath) => {
    await downloadStorageObjectToFile(photo.storageKey, filePath);

    try {
      const preview = await buildPreviewFromFile({
        fileName: photo.originalName,
        filePath,
      });
      const previewKey = getCollectionPreviewKey({
        userId: photo.collection.userId,
        collectionId: photo.collectionId,
        photoId: photo.id,
        fileName: photo.originalName,
      });

      await putStorageObject({
        key: previewKey,
        body: preview.previewBuffer,
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable",
      });
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          processingStatus: "READY",
          previewKey,
          width: preview.width,
          height: preview.height,
          processedAt: new Date(),
          processingError: null,
        },
      });

      return "READY" as const;
    } catch (error) {
      if (
        shouldTreatPreviewFailureAsOriginalOnly({
          fileName: photo.originalName,
          mimeType: photo.mimeType,
        })
      ) {
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            processingStatus: "ORIGINAL_ONLY",
            previewKey: null,
            width: null,
            height: null,
            processedAt: new Date(),
            processingError: null,
          },
        });

        return "ORIGINAL_ONLY" as const;
      }

      await deleteStorageObjects(
        [photo.storageKey, photo.previewKey].filter(
          (key): key is string => Boolean(key),
        ),
      );
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          processingStatus: "FAILED",
          previewKey: null,
          width: null,
          height: null,
          sizeBytes: 0n,
          processedAt: new Date(),
          processingError: error instanceof Error ? error.message : "Preview generation failed",
        },
      });
      await prisma.$transaction([
        prisma.collection.update({
          where: { id: photo.collectionId },
          data: {
            totalSizeBytes: {
              decrement: photo.sizeBytes,
            },
          },
        }),
        prisma.user.update({
          where: { id: photo.collection.userId },
          data: {
            storageUsedBytes: {
              decrement: photo.sizeBytes,
            },
          },
        }),
      ]);

      return "FAILED" as const;
    }
  });
}

export async function processPendingPortfolioAssetById(assetId: string) {
  const asset = await prisma.portfolioAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      userId: true,
      storageKey: true,
      previewKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      processingStatus: true,
    },
  });

  if (
    !asset ||
    (asset.processingStatus !== "PENDING" &&
      asset.processingStatus !== "PROCESSING")
  ) {
    return null;
  }

  await prisma.portfolioAsset.update({
    where: { id: asset.id },
    data: {
      processingStatus: "PROCESSING",
      processingStartedAt: new Date(),
      processingError: null,
    },
  });

  return withTempFile("portfolio-worker-", async (filePath) => {
    await downloadStorageObjectToFile(asset.storageKey, filePath);

    try {
      const preview = await buildPreviewFromFile({
        fileName: asset.originalName,
        filePath,
      });
      const previewKey = getPortfolioPreviewKey({
        userId: asset.userId,
        assetId: asset.id,
        fileName: asset.originalName,
      });

      await putStorageObject({
        key: previewKey,
        body: preview.previewBuffer,
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable",
      });
      await prisma.portfolioAsset.update({
        where: { id: asset.id },
        data: {
          processingStatus: "READY",
          previewKey,
          width: preview.width,
          height: preview.height,
          processedAt: new Date(),
          processingError: null,
        },
      });

      return "READY" as const;
    } catch (error) {
      if (
        shouldTreatPreviewFailureAsOriginalOnly({
          fileName: asset.originalName,
          mimeType: asset.mimeType,
        })
      ) {
        await prisma.portfolioAsset.update({
          where: { id: asset.id },
          data: {
            processingStatus: "ORIGINAL_ONLY",
            previewKey: null,
            width: null,
            height: null,
            processedAt: new Date(),
            processingError: null,
          },
        });

        return "ORIGINAL_ONLY" as const;
      }

      await deleteStorageObjects(
        [asset.storageKey, asset.previewKey].filter(
          (key): key is string => Boolean(key),
        ),
      );
      await prisma.portfolioAsset.update({
        where: { id: asset.id },
        data: {
          processingStatus: "FAILED",
          previewKey: null,
          width: null,
          height: null,
          sizeBytes: 0n,
          processedAt: new Date(),
          processingError: error instanceof Error ? error.message : "Preview generation failed",
        },
      });
      await prisma.$transaction([
        prisma.user.update({
          where: { id: asset.userId },
          data: {
            storageUsedBytes: {
              decrement: asset.sizeBytes,
            },
          },
        }),
      ]);

      return "FAILED" as const;
    }
  });
}

export async function processNextPendingMediaJob() {
  const nextPhoto = await prisma.photo.findFirst({
    where: {
      processingStatus: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (nextPhoto) {
    return {
      type: "photo" as const,
      id: nextPhoto.id,
      result: await processPendingPhotoById(nextPhoto.id),
    };
  }

  const nextPortfolioAsset = await prisma.portfolioAsset.findFirst({
    where: {
      processingStatus: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (nextPortfolioAsset) {
    return {
      type: "portfolio-asset" as const,
      id: nextPortfolioAsset.id,
      result: await processPendingPortfolioAssetById(nextPortfolioAsset.id),
    };
  }

  return null;
}
