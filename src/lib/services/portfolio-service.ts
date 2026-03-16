import { randomUUID } from "node:crypto";

import { canManageProtectedContent } from "@/lib/core/access";
import { ensureStorageQuota } from "@/lib/core/quota";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  getPreferredUploadContentType,
  isAcceptedPhotoUpload,
} from "@/lib/media-upload";
import { buildPortfolioAssetKeys } from "@/lib/storage/object-keys";
import {
  createSignedUploadUrl,
  deleteStorageObjects,
  headStorageObject,
} from "@/lib/storage/s3";
import type {
  PreparedUpload,
  PreparedUploadToken,
  UploadFileInput,
} from "@/lib/uploads";

function validateRequestedImageUpload(input: {
  fileName: string;
  mimeType: string;
}) {
  if (!isAcceptedPhotoUpload(input)) {
    throw new AppError(
      "Поддерживаются только фотографии и исходники камер. SVG и другие не-фото форматы загружать нельзя.",
      400,
    );
  }
}

function normalizeMimeType(contentType?: string) {
  return contentType?.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

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

export async function preparePortfolioAssetUploads(input: {
  userId: string;
  files: UploadFileInput[];
}) {
  if (!input.files.length) {
    throw new AppError("Выберите хотя бы один файл для портфолио.", 400);
  }

  const user = await requirePortfolioOwner(input.userId);
  let projectedUsage = user.storageUsedBytes;
  const preparedUploads: PreparedUpload[] = [];

  for (const file of input.files) {
    const uploadMimeType = getPreferredUploadContentType(file.type);

    validateRequestedImageUpload({
      fileName: file.name,
      mimeType: file.type,
    });

    const quota = ensureStorageQuota({
      currentUsageBytes: projectedUsage,
      incomingBytes: BigInt(file.size),
      limitBytes: user.storageLimitBytes,
    });

    if (!quota.allowed) {
      throw new AppError("Лимит хранилища будет превышен.", 400);
    }

    const uploadId = randomUUID();
    const keys = buildPortfolioAssetKeys({
      userId: input.userId,
      objectId: uploadId,
      fileName: file.name,
    });

    preparedUploads.push({
      uploadId,
      fileName: file.name,
      mimeType: uploadMimeType,
      sizeBytes: file.size,
      uploadUrl: await createSignedUploadUrl({
        key: keys.originalKey,
        contentType: uploadMimeType,
      }),
    });

    projectedUsage += BigInt(file.size);
  }

  return preparedUploads;
}

export async function completePortfolioAssetUploads(input: {
  userId: string;
  uploads: PreparedUploadToken[];
}) {
  if (!input.uploads.length) {
    throw new AppError("Выберите хотя бы один файл для портфолио.", 400);
  }

  const user = await requirePortfolioOwner(input.userId);
  const currentCount = await prisma.portfolioAsset.count({
    where: {
      userId: input.userId,
      processingStatus: {
        not: "FAILED",
      },
    },
  });
  const originalKeysToCleanup = input.uploads.map((upload) =>
    buildPortfolioAssetKeys({
      userId: input.userId,
      objectId: upload.uploadId,
      fileName: upload.fileName,
    }).originalKey,
  );
  const preparedAssets: Array<{
    id: string;
    storageKey: string;
    previewKey: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    width: number | null;
    height: number | null;
    sortOrder: number;
  }> = [];
  let projectedUsage = user.storageUsedBytes;
  let totalOriginalBytes = 0n;

  try {
    for (const [index, upload] of input.uploads.entries()) {
      validateRequestedImageUpload({
        fileName: upload.fileName,
        mimeType: upload.mimeType,
      });

      const keys = buildPortfolioAssetKeys({
        userId: input.userId,
        objectId: upload.uploadId,
        fileName: upload.fileName,
      });
      const storedObject = await headStorageObject(keys.originalKey);
      const originalSizeBytes = BigInt(storedObject.contentLength ?? upload.sizeBytes);
      const mimeType = normalizeMimeType(storedObject.contentType || upload.mimeType);
      const quota = ensureStorageQuota({
        currentUsageBytes: projectedUsage,
        incomingBytes: originalSizeBytes,
        limitBytes: user.storageLimitBytes,
      });

      if (!quota.allowed) {
        throw new AppError("Лимит хранилища будет превышен.", 400);
      }

      preparedAssets.push({
        id: upload.uploadId,
        storageKey: keys.originalKey,
        previewKey: null,
        originalName: upload.fileName,
        mimeType,
        sizeBytes: originalSizeBytes,
        width: null,
        height: null,
        sortOrder: currentCount + index,
      });

      projectedUsage += originalSizeBytes;
      totalOriginalBytes += originalSizeBytes;
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
          processingStatus: "PENDING",
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
    await deleteStorageObjects(originalKeysToCleanup);
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

  await deleteStorageObjects([asset.storageKey, asset.previewKey ?? ""]);
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
