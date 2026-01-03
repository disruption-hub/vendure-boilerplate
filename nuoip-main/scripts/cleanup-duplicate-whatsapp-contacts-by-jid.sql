-- Cleanup duplicate WhatsApp contacts with the same JID
-- This script identifies and removes duplicate WhatsApp contacts that share the same JID
-- It keeps the contact with the most recent activity or the one linked to a user

-- Step 1: Identify duplicates by JID and tenant
WITH duplicate_contacts AS (
  SELECT 
    jid,
    tenant_id,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY 
      CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 2 END, -- Prefer contacts linked to users
      "lastMessageAt" DESC NULLS LAST, -- Then by most recent activity
      "createdAt" DESC -- Then by creation date
    ) as contact_ids,
    ARRAY_AGG(id ORDER BY 
      CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 2 END,
      "lastMessageAt" DESC NULLS LAST,
      "createdAt" DESC
    )[1] as keep_id -- Keep the first one (best candidate)
  FROM whatsapp_contacts
  WHERE jid IS NOT NULL
  GROUP BY jid, tenant_id
  HAVING COUNT(*) > 1
)
SELECT 
  jid,
  tenant_id,
  duplicate_count,
  contact_ids,
  keep_id,
  -- Get details of contacts to keep
  (SELECT name FROM whatsapp_contacts WHERE id = keep_id) as keep_name,
  (SELECT "sessionId" FROM whatsapp_contacts WHERE id = keep_id) as keep_session_id,
  -- Get details of contacts to remove
  ARRAY(
    SELECT id FROM whatsapp_contacts 
    WHERE jid = dc.jid 
      AND "tenantId" = dc.tenant_id 
      AND id != dc.keep_id
  ) as remove_ids
FROM duplicate_contacts dc
ORDER BY jid, tenant_id;

-- Step 2: For the specific case of Alberto Saco (51981281297@s.whatsapp.net)
-- Let's check what we have:
SELECT 
  wc.id,
  wc.jid,
  wc.name,
  wc."sessionId",
  wc."tenantId",
  wc."chatbotContactId",
  wc."userId",
  wc."lastMessageAt",
  wc."createdAt",
  cc.id as chatbot_contact_id,
  cc."displayName" as chatbot_contact_name,
  u.id as user_id,
  u.name as user_name
FROM whatsapp_contacts wc
LEFT JOIN chatbot_contacts cc ON wc."chatbotContactId" = cc.id
LEFT JOIN users u ON wc."userId" = u.id
WHERE wc.jid = '51981281297@s.whatsapp.net'
ORDER BY 
  CASE WHEN wc."userId" IS NOT NULL THEN 1 ELSE 2 END,
  wc."lastMessageAt" DESC NULLS LAST,
  wc."createdAt" DESC;

-- Step 3: Update ChatbotContact metadata to point to the correct WhatsApp contact
-- First, identify which contact to keep (prefer user-linked, then most recent)
WITH contact_to_keep AS (
  SELECT 
    id,
    jid,
    "sessionId",
    "chatbotContactId",
    "userId",
    ROW_NUMBER() OVER (
      PARTITION BY jid, "tenantId" 
      ORDER BY 
        CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 2 END,
        "lastMessageAt" DESC NULLS LAST,
        "createdAt" DESC
    ) as rn
  FROM whatsapp_contacts
  WHERE jid = '51981281297@s.whatsapp.net'
)
UPDATE chatbot_contacts cc
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{whatsappSessionId}',
  to_jsonb(ctk."sessionId"::text)
) || jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{whatsappJid}',
  to_jsonb(ctk.jid::text)
)
FROM contact_to_keep ctk
WHERE ctk.rn = 1
  AND (
    cc.id = ctk."chatbotContactId"
    OR (cc.metadata->>'whatsappJid') = ctk.jid
  );

-- Step 4: Delete duplicate WhatsApp contacts (keep only the best one per JID)
WITH contact_to_keep AS (
  SELECT 
    id,
    jid,
    ROW_NUMBER() OVER (
      PARTITION BY jid, "tenantId" 
      ORDER BY 
        CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 2 END,
        "lastMessageAt" DESC NULLS LAST,
        "createdAt" DESC
    ) as rn
  FROM whatsapp_contacts
  WHERE jid = '51981281297@s.whatsapp.net'
)
DELETE FROM whatsapp_contacts wc
WHERE wc.jid = '51981281297@s.whatsapp.net'
  AND wc.id NOT IN (
    SELECT id FROM contact_to_keep WHERE rn = 1
  );

-- Step 5: Verify cleanup
SELECT 
  jid,
  COUNT(*) as remaining_count,
  ARRAY_AGG(id) as contact_ids,
  ARRAY_AGG(name) as names
FROM whatsapp_contacts
WHERE jid = '51981281297@s.whatsapp.net'
GROUP BY jid;

