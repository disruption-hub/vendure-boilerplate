-- Check for recent WhatsApp messages and contacts
SELECT count(*) as message_count FROM whatsapp_messages;
SELECT * FROM whatsapp_messages ORDER BY "timestamp" DESC LIMIT 5;
SELECT * FROM chatbot_contacts WHERE type = 'CONTACT' ORDER BY "createdAt" DESC LIMIT 5;
