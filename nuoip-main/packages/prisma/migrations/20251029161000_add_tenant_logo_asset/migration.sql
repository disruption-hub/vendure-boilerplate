CREATE TABLE "tenant_logo_assets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_logo_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_logo_assets_id_key" ON "tenant_logo_assets"("id");

ALTER TABLE "tenant_logo_assets"
ADD CONSTRAINT "tenant_logo_assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
