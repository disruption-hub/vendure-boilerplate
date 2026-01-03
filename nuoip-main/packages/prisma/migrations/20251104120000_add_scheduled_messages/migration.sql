-- CreateEnum
CREATE TYPE "ScheduledMessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduledMessageTarget" AS ENUM ('FLOWBOT', 'TENANT_USER');

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "contactId" TEXT,
    "recipientId" TEXT,
    "sessionId" TEXT,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "ScheduledMessageStatus" NOT NULL DEFAULT 'PENDING',
    "targetType" "ScheduledMessageTarget" NOT NULL DEFAULT 'FLOWBOT',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scheduled_messages"
ADD CONSTRAINT "scheduled_messages_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages"
ADD CONSTRAINT "scheduled_messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages"
ADD CONSTRAINT "scheduled_messages_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "chatbot_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "scheduled_messages_tenantId_senderId_idx"
ON "scheduled_messages"("tenantId", "senderId");

-- CreateIndex
CREATE INDEX "scheduled_messages_status_scheduledAt_idx"
ON "scheduled_messages"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_messages_tenantId_contactId_idx"
ON "scheduled_messages"("tenantId", "contactId");

