-- Data migration: Assign tenantId to existing products that have NULL tenantId
-- This script assigns all products to the MatMax tenant

-- Step 1: Update all products with NULL tenantId to MatMax tenant
UPDATE "payment_products" pp
SET "tenantId" = (
    SELECT id
    FROM "tenants"
    WHERE (
        LOWER("name") LIKE '%matmax%'
        OR LOWER("subdomain") LIKE '%matmax%'
        OR LOWER("domain") LIKE '%matmax%'
    )
    AND "isActive" = true
    LIMIT 1
)
WHERE pp."tenantId" IS NULL;

-- Step 3: Verify no products have NULL tenantId
-- This should return 0 rows if successful
SELECT COUNT(*) as products_with_null_tenantid
FROM "payment_products"
WHERE "tenantId" IS NULL;

