-- CreateEnum
CREATE TYPE "MediaProcessingStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'READY',
    'ORIGINAL_ONLY',
    'FAILED'
);

-- AlterTable
ALTER TABLE "Photo"
    ALTER COLUMN "previewKey" DROP NOT NULL,
    ALTER COLUMN "width" DROP NOT NULL,
    ALTER COLUMN "height" DROP NOT NULL,
    ADD COLUMN "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "processingError" TEXT,
    ADD COLUMN "processedAt" TIMESTAMP(3),
    ADD COLUMN "processingStartedAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PortfolioAsset"
    ALTER COLUMN "previewKey" DROP NOT NULL,
    ALTER COLUMN "width" DROP NOT NULL,
    ALTER COLUMN "height" DROP NOT NULL,
    ADD COLUMN "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "processingError" TEXT,
    ADD COLUMN "processedAt" TIMESTAMP(3),
    ADD COLUMN "processingStartedAt" TIMESTAMP(3);

-- Backfill existing media
UPDATE "Photo"
SET
    "processingStatus" = 'READY',
    "processedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

UPDATE "PortfolioAsset"
SET
    "processingStatus" = 'READY',
    "processedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

-- AddIndex
CREATE INDEX "Photo_processingStatus_createdAt_idx"
ON "Photo"("processingStatus", "createdAt");

-- AddIndex
CREATE INDEX "PortfolioAsset_processingStatus_createdAt_idx"
ON "PortfolioAsset"("processingStatus", "createdAt");

-- Cleanup defaults used only for backfill
ALTER TABLE "Photo"
    ALTER COLUMN "updatedAt" DROP DEFAULT;
