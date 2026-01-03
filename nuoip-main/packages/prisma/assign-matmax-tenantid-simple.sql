-- Simple SQL to assign MatMax tenantId to all products with NULL tenantId
-- MatMax tenant ID: cmh9wylc60001tjs1qy2wm9ok (from logs)

UPDATE "payment_products" 
SET "tenantId" = 'cmh9wylc60001tjs1qy2wm9ok'
WHERE "tenantId" IS NULL;

-- Verify
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN "tenantId" IS NULL THEN 1 END) as products_without_tenant,
    COUNT(CASE WHEN "tenantId" = 'cmh9wylc60001tjs1qy2wm9ok' THEN 1 END) as products_with_matmax_tenant
FROM "payment_products";

