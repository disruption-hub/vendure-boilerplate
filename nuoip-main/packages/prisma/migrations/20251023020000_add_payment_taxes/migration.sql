-- Create table for payment taxes
CREATE TABLE "payment_taxes" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "country_code" VARCHAR(3) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "rate_bps" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "metadata" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Extend payment products with tax-aware pricing
ALTER TABLE "payment_products"
    ADD COLUMN "base_amount_cents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tax_amount_cents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tax_id" TEXT;

UPDATE "payment_products"
SET "base_amount_cents" = "amountCents",
    "tax_amount_cents" = 0
WHERE "base_amount_cents" = 0;

ALTER TABLE "payment_products"
    ALTER COLUMN "base_amount_cents" DROP DEFAULT;

ALTER TABLE "payment_products"
    ADD CONSTRAINT "payment_products_tax_id_fkey"
        FOREIGN KEY ("tax_id") REFERENCES "payment_taxes"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "payment_products_tax_id_idx" ON "payment_products" ("tax_id");

-- Extend payment links to snapshot tax details
ALTER TABLE "payment_links"
    ADD COLUMN "tax_id" TEXT,
    ADD COLUMN "base_amount_cents" INTEGER,
    ADD COLUMN "tax_amount_cents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tax_rate_bps" INTEGER;

UPDATE "payment_links"
SET "base_amount_cents" = "amountCents",
    "tax_amount_cents" = 0
WHERE "base_amount_cents" IS NULL;

ALTER TABLE "payment_links"
    ALTER COLUMN "base_amount_cents" SET NOT NULL;

ALTER TABLE "payment_links"
    ADD CONSTRAINT "payment_links_tax_id_fkey"
        FOREIGN KEY ("tax_id") REFERENCES "payment_taxes"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "payment_links_tax_id_idx" ON "payment_links" ("tax_id");
