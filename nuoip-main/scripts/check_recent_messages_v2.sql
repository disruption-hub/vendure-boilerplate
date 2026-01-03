-- Check for recent WhatsApp messages and contacts with better formatting
\x
SELECT count(*) as message_count FROM whatsapp_messages;
SELECT id, "remoteJid", content, "timestamp", status FROM whatsapp_messages ORDER BY "timestamp" DESC LIMIT 5;
SELECT id, "displayName", phone, metadata->>'whatsappJid' as jid FROM chatbot_contacts WHERE type = 'CONTACT' ORDER BY "createdAt" DESC LIMIT 5;
