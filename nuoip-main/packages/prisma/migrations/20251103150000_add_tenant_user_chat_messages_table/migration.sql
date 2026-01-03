-- Create table for tenant user direct messages
CREATE TABLE IF NOT EXISTS "tenant_user_chat_messages" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "threadKey" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "tenant_user_chat_messages_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tenant_user_chat_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tenant_user_chat_messages_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Supporting index for thread lookups
CREATE INDEX IF NOT EXISTS "tenant_user_chat_messages_thread_idx"
  ON "tenant_user_chat_messages" ("tenantId", "threadKey", "createdAt");
