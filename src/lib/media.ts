import sharp from "sharp";

import { AppError } from "@/lib/errors";

type PreviewSource = {
  fileName: string;
  source: Buffer | string;
};

async function buildPreviewFromSharpInput(input: PreviewSource) {
  const image = sharp(input.source, {
    failOn: "error",
  });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new AppError(`Не удалось определить размеры изображения ${input.fileName}.`, 400);
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
    previewBuffer,
    width: metadata.width,
    height: metadata.height,
  };
}

export async function buildPreviewFromBuffer(input: {
  fileName: string;
  buffer: Buffer;
}) {
  return buildPreviewFromSharpInput({
    fileName: input.fileName,
    source: input.buffer,
  });
}

export async function buildPreviewFromFile(input: {
  fileName: string;
  filePath: string;
}) {
  return buildPreviewFromSharpInput({
    fileName: input.fileName,
    source: input.filePath,
  });
}
