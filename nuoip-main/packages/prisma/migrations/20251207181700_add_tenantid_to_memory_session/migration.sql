-- Add tenantId to MemorySession for tenant-based counts
ALTER TABLE "MemorySession" ADD COLUMN "tenantId" TEXT;

-- Add index for tenant-based queries
CREATE INDEX "MemorySession_tenantId_idx" ON "MemorySession"("tenantId");

-- Add foreign key constraint
ALTER TABLE "MemorySession" ADD CONSTRAINT "MemorySession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
