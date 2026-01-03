-- Migration script to update orphaned WhatsApp contacts
-- This script updates contacts linked to a missing session

-- First, let's see what sessions exist
SELECT 
    session_id,
    status,
    tenant_id,
    name,
    last_sync
FROM whatsapp_session
ORDER BY last_sync DESC;

-- Count contacts linked to the missing session
SELECT COUNT(*) as orphaned_contacts
FROM whatsapp_contact
WHERE session_id = 'session-1764628788062';

-- See which contacts are orphaned
SELECT 
    id,
    jid,
    name,
    session_id
FROM whatsapp_contact
WHERE session_id = 'session-1764628788062';

-- Update: Replace 'NEW_SESSION_ID' with the actual active session ID from the first query
-- UPDATE whatsapp_contact
-- SET session_id = 'NEW_SESSION_ID'
-- WHERE session_id = 'session-1764628788062';
