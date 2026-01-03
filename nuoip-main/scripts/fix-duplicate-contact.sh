#!/bin/bash
# Quick fix script to delete the OLD WhatsApp contact duplicate

# Connect to Railway database and execute the deletion
railway run -s backend -- npx prisma db execute --stdin <<EOF
-- Delete the OLD duplicate contact from the old session
DELETE FROM whatsapp_contacts 
WHERE jid = '51981281297@s.whatsapp.net' 
  AND "sessionId" = 'session-1764606877888';

-- Verify deletion
SELECT 
    id,
    "sessionId",
    jid,
    name,
    "chatbotContactId",
    "createdAt"
FROM whatsapp_contacts
WHERE jid = '51981281297@s.whatsapp.net';
EOF

echo "✅ Duplicate contact deletion complete. Refreshing the page should now show only one contact for this number."
