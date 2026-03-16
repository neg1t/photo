const RAW_PHOTO_EXTENSIONS = [
  "dng",
  "nef",
  "cr2",
  "cr3",
  "arw",
  "raf",
  "orf",
  "rw2",
  "srw",
  "pef",
  "x3f",
  "3fr",
  "iiq",
  "erf",
  "mef",
  "mos",
  "nrw",
] as const;

const STANDARD_PHOTO_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "heic",
  "heif",
  "tif",
  "tiff",
  "gif",
] as const;

const STANDARD_PREVIEWABLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ACCEPTED_PHOTO_EXTENSIONS = new Set<string>([
  ...STANDARD_PHOTO_EXTENSIONS,
  ...RAW_PHOTO_EXTENSIONS,
]);

const NON_PHOTO_IMAGE_MIME_TYPES = new Set(["image/svg+xml"]);

function normalizeMimeType(mimeType: string) {
  return mimeType.trim().toLowerCase();
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).trim().toLowerCase();
}

export function isAcceptedPhotoUpload(input: {
  fileName: string;
  mimeType: string;
}) {
  const mimeType = normalizeMimeType(input.mimeType);
  const extension = getFileExtension(input.fileName);

  if (mimeType.startsWith("image/") && !NON_PHOTO_IMAGE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return ACCEPTED_PHOTO_EXTENSIONS.has(extension);
}

export function shouldTreatPreviewFailureAsOriginalOnly(input: {
  fileName: string;
  mimeType: string;
}) {
  const mimeType = normalizeMimeType(input.mimeType);
  const extension = getFileExtension(input.fileName);

  if (!isAcceptedPhotoUpload(input)) {
    return false;
  }

  if (STANDARD_PREVIEWABLE_MIME_TYPES.has(mimeType)) {
    return false;
  }

  return !["jpg", "jpeg", "png", "webp"].includes(extension);
}

export function buildPhotoFileInputAccept() {
  return ["image/*", ...Array.from(ACCEPTED_PHOTO_EXTENSIONS, (extension) => `.${extension}`)].join(
    ",",
  );
}

export function getPreferredUploadContentType(mimeType: string) {
  const normalized = normalizeMimeType(mimeType);

  return normalized || "application/octet-stream";
}
