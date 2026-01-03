-- Migration: Merge Duplicate WhatsAppContact Records
-- This script identifies and merges duplicate contacts (same tenant + JID)
-- Preserves contacts with chatbotContactId links

-- Step 1: Identify duplicates
\echo '=== Identifying duplicate contacts ==='
SELECT 
  "tenantId",
  "jid",
  COUNT(*) as duplicate_count,
  array_agg("id" ORDER BY 
    CASE WHEN "chatbotContactId" IS NULL THEN 1 ELSE 0 END,  -- chatbotContactId first
    "createdAt" DESC  -- then newest
  ) as contact_ids
FROM "whatsapp_contacts"
WHERE "tenantId" IS NOT NULL
GROUP BY "tenantId", "jid"
HAVING COUNT(*) > 1;

-- Step 2: Merge duplicates (preserve chatbotContactId links)
DO $$
DECLARE
  duplicate_record RECORD;
  keep_id TEXT;
  delete_ids TEXT[];
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Merging duplicate contacts ===';
  
  -- For each duplicate group
  FOR duplicate_record IN 
    SELECT 
      "tenantId",
      "jid",
      array_agg("id" ORDER BY 
        CASE WHEN "chatbotContactId" IS NULL THEN 1 ELSE 0 END,
        "createdAt" DESC
      ) as contact_ids
    FROM "whatsapp_contacts"
    WHERE "tenantId" IS NOT NULL
    GROUP BY "tenantId", "jid"
    HAVING COUNT(*) > 1
  LOOP
    -- Keep first contact (one with chatbotContactId or newest)
    keep_id := duplicate_record.contact_ids[1];
    delete_ids := duplicate_record.contact_ids[2:array_length(duplicate_record.contact_ids, 1)];
    
    -- Log what we're doing
    RAISE NOTICE 'Tenant: %, JID: %', duplicate_record."tenantId", duplicate_record."jid";
    RAISE NOTICE '  Keeping: %', keep_id;
    RAISE NOTICE '  Deleting: % contacts', array_length(delete_ids, 1);
    
    -- Delete duplicate contacts (messages will cascade delete)
    DELETE FROM "whatsapp_contacts"
    WHERE "id" = ANY(delete_ids);
    
    deleted_count := deleted_count + array_length(delete_ids, 1);
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Merged % duplicate contacts', deleted_count;
END $$;

-- Step 3: Verify no duplicates remain
\echo ''
\echo '=== Verification ==='
SELECT COUNT(*) as remaining_duplicates
FROM (
  SELECT "tenantId", "jid", COUNT(*) as cnt
  FROM "whatsapp_contacts"
  WHERE "tenantId" IS NOT NULL
  GROUP BY "tenantId", "jid"
  HAVING COUNT(*) > 1
) as dups;

-- Step 4: Show summary
SELECT 
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN "chatbotContactId" IS NOT NULL THEN 1 END) as with_chatbot_link,
  COUNT(DISTINCT "tenantId") as unique_tenants,
  COUNT(DISTINCT "jid") as unique_jids
FROM "whatsapp_contacts";
