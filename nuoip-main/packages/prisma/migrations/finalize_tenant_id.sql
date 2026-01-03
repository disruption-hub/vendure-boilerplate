-- Migration: Finalize tenantId in whatsapp_contacts
-- Step 1: Make tenantId NOT NULL
-- Step 2: Add unique constraint [tenantId, jid]
-- Step 3: Drop unique constraint [sessionId, jid]

-- Make tenantId required
ALTER TABLE "whatsapp_contacts" 
ALTER COLUMN "tenantId" SET NOT NULL;

-- Drop old unique constraint
ALTER TABLE "whatsapp_contacts"
DROP CONSTRAINT IF EXISTS "whatsapp_contacts_sessionId_jid_key";

-- Add new unique constraint
ALTER TABLE "whatsapp_contacts"
ADD CONSTRAINT "whatsapp_contacts_tenantId_jid_key" UNIQUE ("tenantId", "jid");

-- Verify
\echo '=== Verification ==='
\echo 'Checking for NULL tenantId...'
SELECT COUNT(*) FROM "whatsapp_contacts" WHERE "tenantId" IS NULL;

\echo 'Checking for duplicates on [tenantId, jid]...'
SELECT "tenantId", "jid", COUNT(*)
FROM "whatsapp_contacts"
GROUP BY "tenantId", "jid"
HAVING COUNT(*) > 1;

\echo ''
\echo '✅ Schema finalization complete!'
