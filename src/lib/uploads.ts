import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().max(120),
  size: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const preparedUploadTokenSchema = z.object({
  uploadId: z.string().min(1).max(120),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const preparedUploadSchema = preparedUploadTokenSchema.extend({
  uploadUrl: z.string().url(),
});

export const uploadRoutePayloadSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("prepare"),
    files: z.array(uploadFileSchema).min(1),
  }),
  z.object({
    intent: z.literal("complete"),
    uploads: z.array(preparedUploadTokenSchema).min(1),
  }),
]);

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type PreparedUpload = z.infer<typeof preparedUploadSchema>;
export type PreparedUploadToken = z.infer<typeof preparedUploadTokenSchema>;
export type UploadRoutePayload = z.infer<typeof uploadRoutePayloadSchema>;
