import sharp from "sharp";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { isSupportedImageMimeType } from "@/lib/storage/object-keys";

type ProcessImageInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

export async function processImageBuffer(input: ProcessImageInput) {
  if (!isSupportedImageMimeType(input.mimeType)) {
    throw new AppError("Поддерживаются только JPG, PNG и WebP.", 400);
  }

  if (BigInt(input.buffer.byteLength) > env.product.maxFileSizeBytes) {
    throw new AppError("Файл превышает допустимый размер.", 400);
  }

  const image = sharp(input.buffer, {
    failOn: "error",
  });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new AppError("Не удалось определить размеры изображения.", 400);
  }

  const previewBuffer = await image
    .resize({
      width: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
    })
    .toBuffer();

  return {
    originalBuffer: input.buffer,
    previewBuffer,
    originalSizeBytes: BigInt(input.buffer.byteLength),
    width: metadata.width,
    height: metadata.height,
    originalName: input.fileName,
    mimeType: input.mimeType,
  };
}

export async function processImageFile(file: File) {
  return processImageBuffer({
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    mimeType: file.type,
  });
}
