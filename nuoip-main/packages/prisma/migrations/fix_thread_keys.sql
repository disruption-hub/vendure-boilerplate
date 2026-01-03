-- Migration: Replace colon separator with double-dash in threadKey
-- This fixes Soketi channel name validation (colons are not allowed)

UPDATE tenant_user_chat_messages
SET "threadKey" = REPLACE("threadKey", ':', '--')
WHERE "threadKey" LIKE '%:%';

