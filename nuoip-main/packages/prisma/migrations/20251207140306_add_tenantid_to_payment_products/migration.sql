-- Add tenantId column to payment_products table if it doesn't exist
ALTER TABLE "payment_products" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_products_tenantId_fkey'
  ) THEN
    ALTER TABLE "payment_products" 
    ADD CONSTRAINT "payment_products_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "payment_products_tenantId_idx" ON "payment_products"("tenantId");

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_products_tenantId_productCode_key'
  ) THEN
    ALTER TABLE "payment_products" 
    ADD CONSTRAINT "payment_products_tenantId_productCode_key" 
    UNIQUE ("tenantId", "productCode");
  END IF;
END $$;
