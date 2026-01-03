-- AddColumns to payment_links table
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "customerCountryCode" TEXT;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- Make productId nullable for custom payment links
ALTER TABLE "payment_links" ALTER COLUMN "productId" DROP NOT NULL;
