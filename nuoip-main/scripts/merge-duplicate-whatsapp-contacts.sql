-- Merge Duplicate WhatsApp Contacts Script
-- This script finds and merges duplicate WhatsApp contacts with the same JID but different sessionIds

-- STEP 1: Identify duplicates (DRY RUN - just view)
SELECT 
    jid,
    COUNT(*) as contact_count,
    array_agg(id ORDER BY "createdAt" DESC) as contact_ids,
    array_agg("sessionId" ORDER BY "createdAt" DESC) as session_ids,
    array_agg("chatbotContactId" ORDER BY "createdAt" DESC) as chatbot_contact_ids,
    array_agg("name" ORDER BY "createdAt" DESC) as names
FROM whatsapp_contacts
WHERE "sessionId" IN (
    SELECT "sessionId" 
    FROM whatsapp_sessions 
    WHERE "tenantId" = 'cmh9wylc60001tjs1qy2wm9ok'
)
GROUP BY jid
HAVING COUNT(*) > 1;

-- STEP 2: For JID '51981281297@s.whatsapp.net' specifically:
-- Keep the contact from the NEWER session and delete the old one

-- First, let's see what we have:
SELECT 
    id,
    "sessionId",
    jid,
    name,
    "chatbotContactId",
    "createdAt",
    "lastMessageAt"
FROM whatsapp_contacts
WHERE jid = '51981281297@s.whatsapp.net'
ORDER BY "createdAt" DESC;

-- STEP 3: Delete the OLD contact (from session-1764606877888)
-- UNCOMMENT TO EXECUTE:
-- DELETE FROM whatsapp_contacts 
-- WHERE jid = '51981281297@s.whatsapp.net' 
--   AND "sessionId" = 'session-1764606877888';

-- STEP 4: Verify only one contact remains
-- SELECT 
--     id,
--     "sessionId",
--     jid,
--     name,
--     "chatbotContactId"
-- FROM whatsapp_contacts
-- WHERE jid = '51981281297@s.whatsapp.net';
