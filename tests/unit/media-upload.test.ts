import { describe, expect, it } from "vitest";

import {
  buildPhotoFileInputAccept,
  isAcceptedPhotoUpload,
  shouldTreatPreviewFailureAsOriginalOnly,
} from "@/lib/media-upload";
import { uploadFileSchema } from "@/lib/uploads";

describe("media upload policy", () => {
  it("accepts common web photo formats and camera raw extensions", () => {
    expect(
      isAcceptedPhotoUpload({
        fileName: "wedding.heic",
        mimeType: "image/heic",
      }),
    ).toBe(true);
    expect(
      isAcceptedPhotoUpload({
        fileName: "frame.cr3",
        mimeType: "",
      }),
    ).toBe(true);
    expect(
      isAcceptedPhotoUpload({
        fileName: "portrait.avif",
        mimeType: "image/avif",
      }),
    ).toBe(true);
  });

  it("rejects svg and non-photo payloads", () => {
    expect(
      isAcceptedPhotoUpload({
        fileName: "diagram.svg",
        mimeType: "image/svg+xml",
      }),
    ).toBe(false);
    expect(
      isAcceptedPhotoUpload({
        fileName: "archive.zip",
        mimeType: "application/zip",
      }),
    ).toBe(false);
  });

  it("treats preview failure for raw-like formats as original-only", () => {
    expect(
      shouldTreatPreviewFailureAsOriginalOnly({
        fileName: "session.cr2",
        mimeType: "",
      }),
    ).toBe(true);
    expect(
      shouldTreatPreviewFailureAsOriginalOnly({
        fileName: "session.jpg",
        mimeType: "image/jpeg",
      }),
    ).toBe(false);
  });

  it("builds a wide file input accept string for photo uploads", () => {
    expect(buildPhotoFileInputAccept()).toContain("image/*");
    expect(buildPhotoFileInputAccept()).toContain(".cr3");
    expect(buildPhotoFileInputAccept()).toContain(".heic");
  });
});

describe("uploadFileSchema", () => {
  it("allows files with an empty mime type so extension fallback can work", () => {
    expect(
      uploadFileSchema.parse({
        name: "shoot.cr3",
        type: "",
        size: 12_000_000,
      }),
    ).toEqual({
      name: "shoot.cr3",
      type: "",
      size: 12_000_000,
    });
  });
});
