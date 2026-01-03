-- Delete contacts with status@broadcast JID or empty phone
DELETE FROM whatsapp_contacts WHERE jid = 'status@broadcast';
DELETE FROM chatbot_contacts WHERE phone IS NULL OR phone = '' AND type = 'CONTACT';
