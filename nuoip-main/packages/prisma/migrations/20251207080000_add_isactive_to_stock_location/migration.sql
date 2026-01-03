-- AlterTable
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
