-- CreateEnum
CREATE TYPE "WhatsAppSessionStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_REQUIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'BUTTONS', 'LIST');

-- CreateEnum
CREATE TYPE "WhatsAppRoutingRule" AS ENUM ('FLOWBOT_ONLY', 'USER_ONLY', 'FLOWBOT_FIRST', 'USER_FIRST', 'MANUAL');

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "status" "WhatsAppSessionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "creds" JSONB NOT NULL DEFAULT '{}',
    "keys" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "browserActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSync" TIMESTAMP(3) NOT NULL,
    "lastConnected" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_session_configs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "routingRule" "WhatsAppRoutingRule" NOT NULL DEFAULT 'FLOWBOT_FIRST',
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyMessage" TEXT,
    "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" VARCHAR(8),
    "businessHoursEnd" VARCHAR(8),
    "businessHoursTimezone" VARCHAR(64),
    "awayMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_session_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT,
    "messageType" "WhatsAppMessageType" NOT NULL DEFAULT 'TEXT',
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "mediaSize" INTEGER,
    "thumbnailUrl" TEXT,
    "quotedMessageId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" TEXT,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "isBusiness" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatbotContactId" TEXT,
    "userId" TEXT,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_sessionId_key" ON "whatsapp_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_tenantId_idx" ON "whatsapp_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_status_idx" ON "whatsapp_sessions"("status");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_sessionId_idx" ON "whatsapp_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_session_configs_sessionId_key" ON "whatsapp_session_configs"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_sessionId_messageId_key" ON "whatsapp_messages"("sessionId", "messageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_sessionId_remoteJid_timestamp_idx" ON "whatsapp_messages"("sessionId", "remoteJid", "timestamp");

-- CreateIndex
CREATE INDEX "whatsapp_messages_sessionId_timestamp_idx" ON "whatsapp_messages"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "whatsapp_messages_remoteJid_idx" ON "whatsapp_messages"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_sessionId_jid_key" ON "whatsapp_contacts"("sessionId", "jid");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_sessionId_idx" ON "whatsapp_contacts"("sessionId");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_jid_idx" ON "whatsapp_contacts"("jid");

-- AddForeignKey
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_session_configs" ADD CONSTRAINT "whatsapp_session_configs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whatsapp_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whatsapp_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whatsapp_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_chatbotContactId_fkey" FOREIGN KEY ("chatbotContactId") REFERENCES "chatbot_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

