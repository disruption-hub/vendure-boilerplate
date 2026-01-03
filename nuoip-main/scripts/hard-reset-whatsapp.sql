-- Hard Reset WhatsApp Data
-- WARNING: This deletes ALL WhatsApp messages and contacts!

DO $$
DECLARE
    deleted_messages INT;
    deleted_whatsapp_contacts INT;
    deleted_chatbot_contacts INT;
BEGIN
    RAISE NOTICE '=== Starting Hard Reset ===';

    -- 1. Delete all WhatsApp messages
    WITH deleted AS (
        DELETE FROM whatsapp_messages
        RETURNING id
    )
    SELECT count(*) INTO deleted_messages FROM deleted;
    RAISE NOTICE 'Deleted % WhatsApp messages', deleted_messages;

    -- 2. Delete all WhatsApp contacts
    WITH deleted AS (
        DELETE FROM whatsapp_contacts
        RETURNING id
    )
    SELECT count(*) INTO deleted_whatsapp_contacts FROM deleted;
    RAISE NOTICE 'Deleted % WhatsApp contacts', deleted_whatsapp_contacts;

    -- 3. Delete Chatbot contacts of type CONTACT (created via WhatsApp)
    -- Only delete those that don't have other associations if possible, 
    -- but for a hard reset we generally want to clear them all.
    WITH deleted AS (
        DELETE FROM chatbot_contacts
        WHERE type = 'CONTACT'
        RETURNING id
    )
    SELECT count(*) INTO deleted_chatbot_contacts FROM deleted;
    RAISE NOTICE 'Deleted % Chatbot contacts', deleted_chatbot_contacts;

    RAISE NOTICE '=== Hard Reset Complete ===';
END $$;
