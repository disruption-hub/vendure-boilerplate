ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "subdomain" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_subdomain_key"
ON "tenants" ("subdomain")
WHERE "subdomain" IS NOT NULL;
