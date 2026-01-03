-- WhatsApp Contact Deduplication Script
-- This script identifies and merges duplicate WhatsApp contacts that were created
-- when sessions were deleted and recreated

-- Step 1: Find all duplicate contacts (same JID, different sessionIds, same tenant)
WITH duplicates AS (
  SELECT 
    jid,
    "tenantId",
    COUNT(*) as contact_count,
    array_agg(id ORDER BY "lastMessageAt" DESC NULLS LAST, "createdAt" DESC) as contact_ids,
    array_agg("sessionId" ORDER BY "lastMessageAt" DESC NULLS LAST, "createdAt" DESC) as session_ids,
    array_agg("chatbotContactId" ORDER BY "lastMessageAt" DESC NULLS LAST, "createdAt" DESC) as chatbot_contact_ids
  FROM whatsapp_contacts
  GROUP BY jid, "tenantId"
  HAVING COUNT(*) > 1
)
SELECT 
  jid,
  "tenantId",
  contact_count,
  contact_ids[1] as keep_id,
  contact_ids[2:] as merge_ids,
  session_ids[1] as keep_session_id,
  chatbot_contact_ids[1] as keep_chatbot_contact_id
FROM duplicates
ORDER BY contact_count DESC, jid;

-- Step 2: For each duplicate group, migrate messages to the primary contact
-- (Run this for each duplicate found in Step 1)
-- 
-- UPDATE whatsapp_messages
-- SET "remoteJid" = (SELECT jid FROM whatsapp_contacts WHERE id = '<keep_id>')
-- WHERE "remoteJid" IN (SELECT jid FROM whatsapp_contacts WHERE id = ANY('<merge_ids_array>'))
--   AND "sessionId" IN (SELECT "sessionId" FROM whatsapp_contacts WHERE id = ANY('<merge_ids_array>'));

-- Step 3: Update chatbot_contacts links if needed
-- If the contact to keep doesn't have a chatbotContactId but a duplicate does, use it
-- UPDATE whatsapp_contacts
-- SET "chatbotContactId" = '<chatbot_contact_id_from_duplicate>'
-- WHERE id = '<keep_id>' AND "chatbotContactId" IS NULL;

-- Step 4: Delete duplicate contacts
-- DELETE FROM whatsapp_contacts WHERE id = ANY('<merge_ids_array>');

-- Note: This is a DRY RUN script. To execute the cleanup:
-- 1. Run Step 1 to identify duplicates
-- 2. For each duplicate group, manually run Steps 2-4 with the appropriate IDs
-- 3. Or create a function to automate the process
