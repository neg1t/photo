import sharp from "sharp";

import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { isSupportedImageMimeType } from "@/lib/storage/object-keys";

export async function processImageFile(file: File) {
  if (!isSupportedImageMimeType(file.type)) {
    throw new AppError("Поддерживаются только JPG, PNG и WebP.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (BigInt(buffer.byteLength) > env.product.maxFileSizeBytes) {
    throw new AppError("Файл превышает допустимый размер.", 400);
  }

  const image = sharp(buffer, {
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
    originalBuffer: buffer,
    previewBuffer,
    originalSizeBytes: BigInt(buffer.byteLength),
    width: metadata.width,
    height: metadata.height,
    originalName: file.name,
    mimeType: file.type,
  };
}
