import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5433/vibe?schema=public"),
  NEXTAUTH_SECRET: z.string().min(1).default("dev-secret-not-for-production"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  S3_REGION: z.string().default("ru-central1"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_BUCKET: z.string().default("vibe"),
  S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
  S3_PUBLIC_BASE_URL: z.string().url().default("http://localhost:9000/vibe"),
  DEFAULT_STORAGE_LIMIT_BYTES: z.coerce.bigint().default(53_687_091_200n),
  DEFAULT_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  MAX_FILE_SIZE_BYTES: z.coerce.bigint().default(26_214_400n),
  ZIP_TTL_HOURS: z.coerce.number().int().positive().default(2),
  CLEANUP_CRON_SECRET: z.string().default("dev-cleanup-secret"),
  ADMIN_EMAILS: z.string().default(""),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  databaseUrl: parsedEnv.DATABASE_URL,
  auth: {
    secret: parsedEnv.NEXTAUTH_SECRET,
    url: parsedEnv.NEXTAUTH_URL,
    googleClientId: parsedEnv.GOOGLE_CLIENT_ID,
    googleClientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
    isGoogleConfigured:
      Boolean(parsedEnv.GOOGLE_CLIENT_ID) &&
      Boolean(parsedEnv.GOOGLE_CLIENT_SECRET),
    adminEmails: parsedEnv.ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  },
  storage: {
    region: parsedEnv.S3_REGION,
    endpoint: parsedEnv.S3_ENDPOINT,
    bucket: parsedEnv.S3_BUCKET,
    accessKeyId: parsedEnv.S3_ACCESS_KEY_ID,
    secretAccessKey: parsedEnv.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: parsedEnv.S3_PUBLIC_BASE_URL,
  },
  product: {
    defaultStorageLimitBytes: parsedEnv.DEFAULT_STORAGE_LIMIT_BYTES,
    defaultRetentionDays: parsedEnv.DEFAULT_RETENTION_DAYS,
    maxFileSizeBytes: parsedEnv.MAX_FILE_SIZE_BYTES,
    zipTtlHours: parsedEnv.ZIP_TTL_HOURS,
  },
  cleanup: {
    cronSecret: parsedEnv.CLEANUP_CRON_SECRET,
  },
} as const;
