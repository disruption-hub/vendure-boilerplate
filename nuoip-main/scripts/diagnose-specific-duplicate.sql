-- Diagnostic for specific duplicate number
SELECT 
    id, 
    "displayName", 
    phone, 
    type, 
    "createdAt", 
    metadata
FROM chatbot_contacts
WHERE phone LIKE '%51905448317%' OR "displayName" LIKE '%51905448317%';

SELECT 
    id, 
    "sessionId", 
    jid, 
    "chatbotContactId", 
    "phoneNumber"
FROM whatsapp_contacts
WHERE jid LIKE '%51905448317%';
