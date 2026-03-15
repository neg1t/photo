import { slugifyUsernameSegment } from "@/lib/core/username";

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function buildFileSlug(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0;
  const name = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = hasExtension ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
  const normalizedName = slugifyUsernameSegment(name) || "file";

  return extension ? `${normalizedName}.${extension}` : normalizedName;
}

export function isSupportedImageMimeType(mimeType: string) {
  return SUPPORTED_IMAGE_MIME_TYPES.has(mimeType);
}

export function buildCollectionPhotoKeys(input: {
  userId: string;
  collectionId: string;
  objectId: string;
  fileName: string;
}) {
  const fileSlug = buildFileSlug(input.fileName);

  return {
    originalKey: `users/${input.userId}/collections/${input.collectionId}/originals/${input.objectId}-${fileSlug}`,
    previewKey: `users/${input.userId}/collections/${input.collectionId}/previews/${input.objectId}-preview.webp`,
  };
}

export function buildPortfolioAssetKeys(input: {
  userId: string;
  objectId: string;
  fileName: string;
}) {
  const fileSlug = buildFileSlug(input.fileName);

  return {
    originalKey: `users/${input.userId}/portfolio/originals/${input.objectId}-${fileSlug}`,
    previewKey: `users/${input.userId}/portfolio/previews/${input.objectId}-preview.webp`,
  };
}

export function buildCollectionArchiveKey(input: {
  userId: string;
  collectionId: string;
}) {
  return `users/${input.userId}/collections/${input.collectionId}/archives/latest.zip`;
}
