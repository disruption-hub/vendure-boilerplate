#!/bin/bash

# Script to clean up duplicate WhatsApp contacts with the same JID
# This will keep only one contact per JID per tenant

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Cleaning up duplicate WhatsApp contacts by JID${NC}"
echo -e "${BLUE}===================================================${NC}\n"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Set it with: export DATABASE_URL='your-database-url'${NC}"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/cleanup-duplicate-whatsapp-contacts-by-jid.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Error: SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Identifying duplicate contacts...${NC}"
psql "$DATABASE_URL" -c "
WITH duplicate_contacts AS (
  SELECT 
    jid,
    \"tenantId\",
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY 
      CASE WHEN \"userId\" IS NOT NULL THEN 1 ELSE 2 END,
      \"lastMessageAt\" DESC NULLS LAST,
      \"createdAt\" DESC
    ) as contact_ids
  FROM whatsapp_contacts
  WHERE jid IS NOT NULL
  GROUP BY jid, \"tenantId\"
  HAVING COUNT(*) > 1
)
SELECT 
  jid,
  \"tenantId\",
  duplicate_count,
  contact_ids
FROM duplicate_contacts
ORDER BY jid, \"tenantId\";
"

echo -e "\n${YELLOW}📋 Step 2: Checking specific contact (51981281297@s.whatsapp.net)...${NC}"
psql "$DATABASE_URL" -c "
SELECT 
  wc.id,
  wc.jid,
  wc.name,
  wc.\"sessionId\",
  wc.\"tenantId\",
  wc.\"chatbotContactId\",
  wc.\"userId\",
  wc.\"lastMessageAt\",
  wc.\"createdAt\",
  cc.id as chatbot_contact_id,
  cc.\"displayName\" as chatbot_contact_name,
  u.id as user_id,
  u.name as user_name
FROM whatsapp_contacts wc
LEFT JOIN chatbot_contacts cc ON wc.\"chatbotContactId\" = cc.id
LEFT JOIN users u ON wc.\"userId\" = u.id
WHERE wc.jid = '51981281297@s.whatsapp.net'
ORDER BY 
  CASE WHEN wc.\"userId\" IS NOT NULL THEN 1 ELSE 2 END,
  wc.\"lastMessageAt\" DESC NULLS LAST,
  wc.\"createdAt\" DESC;
"

echo -e "\n${YELLOW}⚠️  This will delete duplicate contacts. Continue? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Cleanup cancelled${NC}"
    exit 0
fi

echo -e "\n${YELLOW}📋 Step 3: Updating ChatbotContact metadata...${NC}"
psql "$DATABASE_URL" -c "
WITH contact_to_keep AS (
  SELECT 
    id,
    jid,
    \"sessionId\",
    \"chatbotContactId\",
    \"userId\",
    ROW_NUMBER() OVER (
      PARTITION BY jid, \"tenantId\" 
      ORDER BY 
        CASE WHEN \"userId\" IS NOT NULL THEN 1 ELSE 2 END,
        \"lastMessageAt\" DESC NULLS LAST,
        \"createdAt\" DESC
    ) as rn
  FROM whatsapp_contacts
  WHERE jid = '51981281297@s.whatsapp.net'
)
UPDATE chatbot_contacts cc
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{whatsappSessionId}',
  to_jsonb(ctk.\"sessionId\"::text)
) || jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{whatsappJid}',
  to_jsonb(ctk.jid::text)
)
FROM contact_to_keep ctk
WHERE ctk.rn = 1
  AND (
    cc.id = ctk.\"chatbotContactId\"
    OR (cc.metadata->>'whatsappJid') = ctk.jid
  );
"

echo -e "\n${YELLOW}📋 Step 4: Deleting duplicate WhatsApp contacts...${NC}"
DELETED=$(psql "$DATABASE_URL" -t -c "
WITH contact_to_keep AS (
  SELECT 
    id,
    jid,
    ROW_NUMBER() OVER (
      PARTITION BY jid, \"tenantId\" 
      ORDER BY 
        CASE WHEN \"userId\" IS NOT NULL THEN 1 ELSE 2 END,
        \"lastMessageAt\" DESC NULLS LAST,
        \"createdAt\" DESC
    ) as rn
  FROM whatsapp_contacts
  WHERE jid = '51981281297@s.whatsapp.net'
)
DELETE FROM whatsapp_contacts wc
WHERE wc.jid = '51981281297@s.whatsapp.net'
  AND wc.id NOT IN (
    SELECT id FROM contact_to_keep WHERE rn = 1
  )
RETURNING wc.id;
" | wc -l | tr -d ' ')

echo -e "${GREEN}✅ Deleted $DELETED duplicate contact(s)${NC}"

echo -e "\n${YELLOW}📋 Step 5: Verifying cleanup...${NC}"
psql "$DATABASE_URL" -c "
SELECT 
  jid,
  COUNT(*) as remaining_count,
  ARRAY_AGG(id) as contact_ids,
  ARRAY_AGG(name) as names
FROM whatsapp_contacts
WHERE jid = '51981281297@s.whatsapp.net'
GROUP BY jid;
"

echo -e "\n${GREEN}✅ Cleanup complete!${NC}"

