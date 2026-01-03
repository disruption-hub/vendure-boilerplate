-- Check WhatsApp sessions for your tenant
SELECT 
    session_id,
    tenant_id,
    status,
    name,
    phone_number,
    is_active,
    last_connected,
    last_sync
FROM whatsapp_session
WHERE tenant_id = 'cmh9wylc60001tjs1qy2wm9ok'
ORDER BY last_sync DESC;

-- Also check all sessions regardless of tenant
SELECT 
    session_id,
    tenant_id,
    status,
    name,
    phone_number,
    is_active,
    last_connected,
    last_sync
FROM whatsapp_session
ORDER BY last_sync DESC LIMIT 10;
