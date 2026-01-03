-- AlterTable
ALTER TABLE "delivery_methods" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "delivery_methods_currency_idx" ON "delivery_methods"("currency");
