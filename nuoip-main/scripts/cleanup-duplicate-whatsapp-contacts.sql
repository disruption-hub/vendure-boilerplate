-- Cleanup Duplicate WhatsApp Contacts
-- This script identifies and helps clean up duplicate ChatbotContact records
-- that were created for the same phone number

-- Step 1: Find duplicate contacts by phone number
-- This shows which phone numbers have multiple ChatbotContact records
SELECT 
    phone,
    "tenantId",
    COUNT(*) as duplicate_count,
    array_agg(id) as contact_ids,
    array_agg("displayName") as names
FROM "ChatbotContact"
WHERE phone IS NOT NULL
  AND type = 'CONTACT'
GROUP BY phone, "tenantId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: For each duplicate group, we need to:
-- 1. Keep the oldest contact (first created)
-- 2. Update all WhatsAppContact records to point to the kept contact
-- 3. Delete the duplicate contacts

-- Example for a specific phone number (replace '+1234567890' with actual):
/*
WITH duplicates AS (
    SELECT id, "createdAt"
    FROM "ChatbotContact"
    WHERE phone = '+1234567890'
      AND type = 'CONTACT'
    ORDER BY "createdAt" ASC
),
keep_contact AS (
    SELECT id FROM duplicates LIMIT 1
)
-- Update WhatsAppContact to point to the kept contact
UPDATE "WhatsAppContact"
SET "chatbotContactId" = (SELECT id FROM keep_contact)
WHERE "chatbotContactId" IN (SELECT id FROM duplicates WHERE id NOT IN (SELECT id FROM keep_contact));

-- Delete duplicate contacts
DELETE FROM "ChatbotContact"
WHERE phone = '+1234567890'
  AND type = 'CONTACT'
  AND id NOT IN (SELECT id FROM keep_contact);
*/

-- Step 3: To automate this for ALL duplicates, run this function:
-- WARNING: Test in development first!
/*
DO $$
DECLARE
    duplicate_phone RECORD;
    keep_id TEXT;
    duplicate_ids TEXT[];
BEGIN
    -- Loop through all duplicate phone numbers
    FOR duplicate_phone IN 
        SELECT phone, "tenantId"
        FROM "ChatbotContact"
        WHERE phone IS NOT NULL AND type = 'CONTACT'
        GROUP BY phone, "tenantId"
        HAVING COUNT(*) > 1
    LOOP
        -- Get the oldest contact ID to keep
        SELECT id INTO keep_id
        FROM "ChatbotContact"
        WHERE phone = duplicate_phone.phone
          AND "tenantId" = duplicate_phone."tenantId"
          AND type = 'CONTACT'
        ORDER BY "createdAt" ASC
        LIMIT 1;
        
        -- Get all duplicate IDs
        SELECT array_agg(id) INTO duplicate_ids
        FROM "ChatbotContact"
        WHERE phone = duplicate_phone.phone
          AND "tenantId" = duplicate_phone."tenantId"
          AND type = 'CONTACT'
          AND id != keep_id;
        
        RAISE NOTICE 'Processing phone: %, keeping: %, removing: %', 
            duplicate_phone.phone, keep_id, array_length(duplicate_ids, 1);
        
        -- Update WhatsAppContact references
        UPDATE "WhatsAppContact"
        SET "chatbotContactId" = keep_id
        WHERE "chatbotContactId" = ANY(duplicate_ids);
        
        -- Delete duplicates
        DELETE FROM "ChatbotContact"
        WHERE id = ANY(duplicate_ids);
    END LOOP;
END $$;
*/
