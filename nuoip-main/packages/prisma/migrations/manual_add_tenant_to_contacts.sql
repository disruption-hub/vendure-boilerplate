-- Migration: Add tenantId to whatsapp_contacts
-- Step 1: Add nullable tenantId column and index

-- Add tenantId column (nullable for now)
ALTER TABLE "whatsapp_contacts" 
ADD COLUMN "tenantId" TEXT;

-- Add index on tenantId
CREATE INDEX "whatsapp_contacts_tenantId_idx" ON "whatsapp_contacts"("tenantId");

-- Backfill tenantId from sessions
UPDATE "whatsapp_contacts" wc
SET "tenantId" = (
  SELECT ws."tenantId"
  FROM "whatsapp_sessions" ws
  WHERE ws."sessionId" = wc."sessionId"
)
WHERE wc."tenantId" IS NULL;

-- Verify all contacts have tenantId
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM "whatsapp_contacts"
  WHERE "tenantId" IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % contacts with NULL tenantId', null_count;
  END IF;
  
  RAISE NOTICE '✅ All contacts have tenantId';
END $$;
