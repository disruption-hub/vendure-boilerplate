-- Add priceIncludesTax flag to payment products to mark tax-inclusive pricing defaults
ALTER TABLE "payment_products"
ADD COLUMN "priceIncludesTax" BOOLEAN NOT NULL DEFAULT TRUE;
