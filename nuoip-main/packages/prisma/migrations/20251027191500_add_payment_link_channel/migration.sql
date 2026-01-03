-- CreateEnum
CREATE TYPE "PaymentLinkChannel" AS ENUM ('chatbot', 'admin', 'api', 'unknown');

-- AlterTable
ALTER TABLE "payment_links"
  ADD COLUMN    "channel" "PaymentLinkChannel" NOT NULL DEFAULT 'unknown',
  ADD COLUMN    "lastStatusChangeAt" TIMESTAMP(3);

UPDATE "payment_links"
SET "lastStatusChangeAt" = COALESCE("lastStatusChangeAt", "updatedAt", "createdAt")
WHERE "lastStatusChangeAt" IS NULL;

-- CreateIndex
CREATE INDEX "payment_links_channel_idx" ON "payment_links"("channel");
