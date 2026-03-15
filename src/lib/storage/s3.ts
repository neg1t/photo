import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

const s3Client = new S3Client({
  region: env.storage.region,
  endpoint: env.storage.endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.storage.accessKeyId,
    secretAccessKey: env.storage.secretAccessKey,
  },
});

let ensuredBucket: Promise<void> | null = null;

async function ensureBucketExists() {
  if (!ensuredBucket) {
    ensuredBucket = (async () => {
      try {
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: env.storage.bucket,
          }),
        );
      } catch {
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: env.storage.bucket,
          }),
        );
      }
    })();
  }

  await ensuredBucket;
}

export async function putStorageObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  await ensureBucketExists();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.storage.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
  );

  return { key: input.key };
}

export async function getStorageObject(key: string) {
  await ensureBucketExists();

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.storage.bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`Storage object ${key} has no body`);
  }

  const bytes = await response.Body.transformToByteArray();

  return {
    bytes,
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength ?? bytes.byteLength,
  };
}

export async function deleteStorageObjects(keys: string[]) {
  if (!keys.length) {
    return;
  }

  await ensureBucketExists();
  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: env.storage.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    }),
  );
}
