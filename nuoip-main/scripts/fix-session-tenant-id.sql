-- Fix current session tenant ID
-- This is a one-time fix for existing sessions that have 'default-tenant'

UPDATE whatsapp_session 
SET tenant_id = 'cmh9wylc60001tjs1qy2wm9ok' 
WHERE session_id = 'session-1764710476977';

-- Verify the fix
SELECT session_id, tenant_id, status, name
FROM whatsapp_session 
WHERE session_id = 'session-1764710476977';

-- Also check all sessions for this tenant
SELECT session_id, tenant_id, status, name, last_sync
FROM whatsapp_session 
WHERE tenant_id = 'cmh9wylc60001tjs1qy2wm9ok'
ORDER BY last_sync DESC;
