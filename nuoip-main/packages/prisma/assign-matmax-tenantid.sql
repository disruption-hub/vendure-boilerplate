-- Quick SQL script to assign MatMax tenantId to all products with NULL tenantId
-- Run this directly on your database or via Railway CLI: railway run psql < packages/prisma/assign-matmax-tenantid.sql

-- Find and update all products with NULL tenantId to MatMax tenant
UPDATE "payment_products" 
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
WHERE "tenantId" IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) as products_without_tenant,
    COUNT(CASE WHEN "tenantId" IS NOT NULL THEN 1 END) as products_with_tenant
FROM "payment_products";

