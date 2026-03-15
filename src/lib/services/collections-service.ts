import { addDays, addHours } from "date-fns";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";

import {
  getCollectionPublicState,
  publishCollection as publishCollectionState,
} from "@/lib/core/collections";
import { ensureStorageQuota } from "@/lib/core/quota";
import { canManageProtectedContent } from "@/lib/core/access";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { processImageFile } from "@/lib/media";
import {
  buildCollectionArchiveKey,
  buildCollectionPhotoKeys,
} from "@/lib/storage/object-keys";
import { deleteStorageObjects, getStorageObject, putStorageObject } from "@/lib/storage/s3";
import { createZipArchive } from "@/lib/zip";

const createCollectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  expiresAt: z.string().optional(),
});

function generateShareToken() {
  return randomBytes(18).toString("hex");
}

function resolveExpirationDate(expiresAt?: string) {
  if (!expiresAt) {
    return addDays(new Date(), env.product.defaultRetentionDays);
  }

  const parsed = new Date(expiresAt);

  if (Number.isNaN(parsed.valueOf())) {
    throw new AppError("Некорректная дата хранения коллекции.", 400);
  }

  if (parsed <= new Date()) {
    throw new AppError("Дата хранения должна быть в будущем.", 400);
  }

  return parsed;
}

async function requireContentOwner(userId: string) {
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
    throw new AppError(
      "Доступ к загрузке и публикации закрыт, пока администратор не активирует ваш аккаунт.",
      403,
    );
  }

  return user;
}

export async function createCollectionForUser(
  userId: string,
  input: z.input<typeof createCollectionSchema>,
) {
  const parsed = createCollectionSchema.parse(input);

  await requireContentOwner(userId);

  return prisma.collection.create({
    data: {
      userId,
      title: parsed.title,
      expiresAt: resolveExpirationDate(parsed.expiresAt),
    },
  });
}

export async function uploadPhotosToCollection(input: {
  userId: string;
  collectionId: string;
  files: File[];
}) {
  if (!input.files.length) {
    throw new AppError("Выберите хотя бы один файл для загрузки.", 400);
  }

  const user = await requireContentOwner(input.userId);
  const collection = await prisma.collection.findFirst({
    where: {
      id: input.collectionId,
      userId: input.userId,
    },
  });

  if (!collection) {
    throw new AppError("Коллекция не найдена.", 404);
  }

  if (collection.storageDeletedAt) {
    throw new AppError("Коллекция уже очищена и недоступна для загрузки.", 400);
  }

  const uploadedKeys: string[] = [];
  const preparedPhotos: Array<{
    id: string;
    storageKey: string;
    previewKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    width: number;
    height: number;
  }> = [];
  let projectedUsage = user.storageUsedBytes;
  let totalOriginalBytes = 0n;

  try {
    for (const file of input.files) {
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
      const keys = buildCollectionPhotoKeys({
        userId: input.userId,
        collectionId: input.collectionId,
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

      preparedPhotos.push({
        id: objectId,
        storageKey: keys.originalKey,
        previewKey: keys.previewKey,
        originalName: image.originalName,
        mimeType: image.mimeType,
        sizeBytes: image.originalSizeBytes,
        width: image.width,
        height: image.height,
      });

      projectedUsage += image.originalSizeBytes;
      totalOriginalBytes += image.originalSizeBytes;
    }

    await prisma.$transaction([
      prisma.photo.createMany({
        data: preparedPhotos.map((photo) => ({
          id: photo.id,
          collectionId: input.collectionId,
          storageKey: photo.storageKey,
          previewKey: photo.previewKey,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          sizeBytes: photo.sizeBytes,
          width: photo.width,
          height: photo.height,
        })),
      }),
      prisma.collection.update({
        where: { id: input.collectionId },
        data: {
          totalSizeBytes: {
            increment: totalOriginalBytes,
          },
        },
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

    return preparedPhotos.length;
  } catch (error) {
    await deleteStorageObjects(uploadedKeys);
    throw error;
  }
}

export async function publishCollectionForUser(userId: string, collectionId: string) {
  await requireContentOwner(userId);
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
  });

  if (!collection) {
    throw new AppError("Коллекция не найдена.", 404);
  }

  if (collection.expiresAt <= new Date()) {
    throw new AppError("Нельзя публиковать коллекцию с истекшим сроком хранения.", 400);
  }

  const publishedCollection = publishCollectionState(
    {
      id: collection.id,
      status: collection.status,
      expiresAt: collection.expiresAt,
      shareToken: collection.shareToken,
      publishedAt: collection.publishedAt,
    },
    generateShareToken,
  );

  return prisma.collection.update({
    where: { id: collectionId },
    data: {
      status: publishedCollection.status,
      shareToken: publishedCollection.shareToken,
      publishedAt: publishedCollection.publishedAt,
    },
  });
}

export async function getCollectionForPublicPage(shareToken: string) {
  const collection = await prisma.collection.findFirst({
    where: { shareToken },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!collection) {
    return null;
  }

  return {
    collection,
    publicState: getCollectionPublicState(
      {
        status: collection.status,
        expiresAt: collection.expiresAt,
      },
      new Date(),
    ),
  };
}

async function requireVisiblePublicCollection(shareToken: string) {
  const payload = await getCollectionForPublicPage(shareToken);

  if (!payload) {
    throw new AppError("Коллекция не найдена.", 404);
  }

  if (payload.publicState === "hidden") {
    throw new AppError("Коллекция недоступна.", 404);
  }

  if (payload.publicState === "expired") {
    throw new AppError("Срок хранения этой коллекции истек.", 410);
  }

  return payload.collection;
}

export async function getPublicPreviewForPhoto(shareToken: string, photoId: string) {
  const collection = await requireVisiblePublicCollection(shareToken);
  const photo = collection.photos.find((candidate) => candidate.id === photoId);

  if (!photo) {
    throw new AppError("Фотография не найдена.", 404);
  }

  return getStorageObject(photo.previewKey);
}

export async function getPublicOriginalForPhoto(shareToken: string, photoId: string) {
  const collection = await requireVisiblePublicCollection(shareToken);
  const photo = collection.photos.find((candidate) => candidate.id === photoId);

  if (!photo) {
    throw new AppError("Фотография не найдена.", 404);
  }

  const storedObject = await getStorageObject(photo.storageKey);

  return {
    ...storedObject,
    fileName: photo.originalName,
  };
}

export async function getOrCreateArchiveForCollection(shareToken: string) {
  const collection = await requireVisiblePublicCollection(shareToken);

  if (!collection.photos.length) {
    throw new AppError("В коллекции пока нет фотографий.", 400);
  }

  const existingArchive = await prisma.collectionArchive.findUnique({
    where: { collectionId: collection.id },
  });

  if (existingArchive && existingArchive.expiresAt > new Date()) {
    return {
      storageKey: existingArchive.storageKey,
      fileName: `${collection.title}.zip`,
    };
  }

  const archiveEntries = await Promise.all(
    collection.photos.map(async (photo) => {
      const storedObject = await getStorageObject(photo.storageKey);

      return {
        name: photo.originalName,
        buffer: storedObject.bytes,
      };
    }),
  );
  const archiveBuffer = await createZipArchive(archiveEntries);
  const archiveKey = buildCollectionArchiveKey({
    userId: collection.userId,
    collectionId: collection.id,
  });
  const archiveExpiresAt = addHours(new Date(), env.product.zipTtlHours);

  await putStorageObject({
    key: archiveKey,
    body: archiveBuffer,
    contentType: "application/zip",
  });
  await prisma.collectionArchive.upsert({
    where: { collectionId: collection.id },
    update: {
      storageKey: archiveKey,
      sizeBytes: BigInt(archiveBuffer.byteLength),
      expiresAt: archiveExpiresAt,
    },
    create: {
      collectionId: collection.id,
      storageKey: archiveKey,
      sizeBytes: BigInt(archiveBuffer.byteLength),
      expiresAt: archiveExpiresAt,
    },
  });

  return {
    storageKey: archiveKey,
    fileName: `${collection.title}.zip`,
  };
}
