import { randomUUID } from "node:crypto";

import { canManageProtectedContent } from "@/lib/core/access";
import { ensureStorageQuota } from "@/lib/core/quota";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { processImageFile } from "@/lib/media";
import { buildPortfolioAssetKeys } from "@/lib/storage/object-keys";
import { deleteStorageObjects, putStorageObject } from "@/lib/storage/s3";

async function requirePortfolioOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessStatus: true,
      storageUsedBytes: true,
      storageLimitBytes: true,
    },
  });

  if (!user) {
    throw new AppError("Пользователь не найден.", 404);
  }

  if (!canManageProtectedContent(user.accessStatus)) {
    throw new AppError("Добавление работ в портфолио недоступно без активного доступа.", 403);
  }

  return user;
}

export async function uploadPortfolioAssets(input: {
  userId: string;
  files: File[];
}) {
  if (!input.files.length) {
    throw new AppError("Выберите хотя бы один файл для портфолио.", 400);
  }

  const user = await requirePortfolioOwner(input.userId);
  const uploadedKeys: string[] = [];
  const currentCount = await prisma.portfolioAsset.count({
    where: { userId: input.userId },
  });
  const preparedAssets: Array<{
    id: string;
    storageKey: string;
    previewKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    width: number;
    height: number;
    sortOrder: number;
  }> = [];
  let projectedUsage = user.storageUsedBytes;
  let totalOriginalBytes = 0n;

  try {
    for (const [index, file] of input.files.entries()) {
      const image = await processImageFile(file);
      const quota = ensureStorageQuota({
        currentUsageBytes: projectedUsage,
        incomingBytes: image.originalSizeBytes,
        limitBytes: user.storageLimitBytes,
      });

      if (!quota.allowed) {
        throw new AppError("Лимит хранилища будет превышен.", 400);
      }

      const objectId = randomUUID();
      const keys = buildPortfolioAssetKeys({
        userId: input.userId,
        objectId,
        fileName: image.originalName,
      });

      await putStorageObject({
        key: keys.originalKey,
        body: image.originalBuffer,
        contentType: image.mimeType,
      });
      uploadedKeys.push(keys.originalKey);
      await putStorageObject({
        key: keys.previewKey,
        body: image.previewBuffer,
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable",
      });
      uploadedKeys.push(keys.previewKey);

      preparedAssets.push({
        id: objectId,
        storageKey: keys.originalKey,
        previewKey: keys.previewKey,
        originalName: image.originalName,
        mimeType: image.mimeType,
        sizeBytes: image.originalSizeBytes,
        width: image.width,
        height: image.height,
        sortOrder: currentCount + index,
      });

      projectedUsage += image.originalSizeBytes;
      totalOriginalBytes += image.originalSizeBytes;
    }

    await prisma.$transaction([
      prisma.portfolioAsset.createMany({
        data: preparedAssets.map((asset) => ({
          id: asset.id,
          userId: input.userId,
          storageKey: asset.storageKey,
          previewKey: asset.previewKey,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          sizeBytes: asset.sizeBytes,
          width: asset.width,
          height: asset.height,
          sortOrder: asset.sortOrder,
        })),
      }),
      prisma.user.update({
        where: { id: input.userId },
        data: {
          storageUsedBytes: {
            increment: totalOriginalBytes,
          },
        },
      }),
    ]);

    return preparedAssets.length;
  } catch (error) {
    await deleteStorageObjects(uploadedKeys);
    throw error;
  }
}

export async function deletePortfolioAsset(userId: string, assetId: string) {
  const asset = await prisma.portfolioAsset.findFirst({
    where: {
      id: assetId,
      userId,
    },
  });

  if (!asset) {
    throw new AppError("Работа из портфолио не найдена.", 404);
  }

  await deleteStorageObjects([asset.storageKey, asset.previewKey]);
  await prisma.$transaction([
    prisma.portfolioAsset.delete({
      where: { id: asset.id },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        storageUsedBytes: {
          decrement: asset.sizeBytes,
        },
      },
    }),
  ]);
}
