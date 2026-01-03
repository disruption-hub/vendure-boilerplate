/*
  Warnings:

  - You are about to drop the column `language` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `createdAt` on table `tenant_user_chat_messages` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TicketType" AS ENUM ('help_desk', 'system_feature', 'system_bug');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TicketSentiment" AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DropForeignKey
ALTER TABLE "communication_channel_settings" DROP CONSTRAINT IF EXISTS "communication_channel_settings_configId_fkey";

-- DropForeignKey
ALTER TABLE "communication_components" DROP CONSTRAINT IF EXISTS "communication_components_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "communication_config" DROP CONSTRAINT IF EXISTS "communication_config_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_configId_fkey";

-- DropForeignKey
ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_sentById_fkey";

-- DropForeignKey
ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_templateId_fkey";

-- DropForeignKey
ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "communication_template_components" DROP CONSTRAINT IF EXISTS "communication_template_components_componentId_fkey";

-- DropForeignKey
ALTER TABLE "communication_template_components" DROP CONSTRAINT IF EXISTS "communication_template_components_templateId_fkey";

-- DropForeignKey
ALTER TABLE "communication_template_translations" DROP CONSTRAINT IF EXISTS "communication_template_translations_templateId_fkey";

-- DropForeignKey
ALTER TABLE "communication_templates" DROP CONSTRAINT IF EXISTS "communication_templates_configId_fkey";

-- DropForeignKey
ALTER TABLE "communication_workflow_steps" DROP CONSTRAINT IF EXISTS "communication_workflow_steps_templateId_fkey";

-- DropForeignKey
ALTER TABLE "communication_workflow_steps" DROP CONSTRAINT IF EXISTS "communication_workflow_steps_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "communication_workflows" DROP CONSTRAINT IF EXISTS "communication_workflows_configId_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_logo_assets" DROP CONSTRAINT IF EXISTS "tenant_logo_assets_tenantId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "communication_config_tenant_idx";

-- DropIndex
DROP INDEX IF EXISTS "tenant_logo_assets_id_key";

-- DropIndex
DROP INDEX IF EXISTS "users_chatbot_access_status";

-- DropIndex
DROP INDEX IF EXISTS "users_tenantId_approvalStatus_idx";

-- DropIndex
DROP INDEX IF EXISTS "users_tenantId_chatbotAccessStatus_idx";

-- DropIndex
DROP INDEX IF EXISTS "users_tenantId_chatbotPhoneUserId_idx";

-- DropIndex
DROP INDEX IF EXISTS "users_tenantId_status_idx";

-- AlterTable
ALTER TABLE "PushSubscription" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chatbot_contact_members" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "chatbot_contacts" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "chatbot_phone_otps" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chatbot_phone_users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "communication_channel_settings" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_component_categories" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_components" ALTER COLUMN "componentKey" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_config" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_logs" ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_template_components" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_template_translations" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_templates" ALTER COLUMN "templateKey" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_workflow_steps" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_workflows" ALTER COLUMN "workflowKey" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "schedule_templates" ADD COLUMN IF NOT EXISTS     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "scheduled_messages" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenant_logo_assets" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenant_signup_requests" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenant_user_chat_messages" ADD COLUMN IF NOT EXISTS     "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "editedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "logoUpdatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "language",
DROP COLUMN IF EXISTS "theme",
DROP COLUMN IF EXISTS "role",
ADD COLUMN IF NOT EXISTS     "role" "UserRole" NOT NULL DEFAULT 'user',
ALTER COLUMN "approvalUpdatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "chatbotApprovedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "chatbotRevokedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastLoginAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastChatbotInteractionAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "preferredLanguage" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "chat_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Embedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "messageId" TEXT,
    "threadId" TEXT,
    "sessionContext" JSONB,
    "tags" TEXT[],
    "responseTargetAt" TIMESTAMP(3),
    "resolvedTargetAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "sentiment" "TicketSentiment" DEFAULT 'neutral',
    "sentimentSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ticket_comment_attachments" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_attachments_messageId_idx" ON "chat_attachments"("messageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Embedding_documentId_idx" ON "Embedding"("documentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_tenantId_status_priority_idx" ON "tickets"("tenantId", "status", "priority");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_tenantId_customerId_idx" ON "tickets"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_tenantId_assignedToId_idx" ON "tickets"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_tenantId_createdAt_idx" ON "tickets"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ticket_comments_ticketId_createdAt_idx" ON "ticket_comments"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ticket_attachments_ticketId_idx" ON "ticket_attachments"("ticketId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ticket_comment_attachments_commentId_idx" ON "ticket_comment_attachments"("commentId");

-- RenameForeignKey
-- ALTER TABLE "chatbot_contact_members" RENAME CONSTRAINT "chatbot_contact_members_contact_id_fkey" TO "chatbot_contact_members_contactId_fkey";

-- RenameForeignKey
-- ALTER TABLE "chatbot_contact_members" RENAME CONSTRAINT "chatbot_contact_members_phone_user_id_fkey" TO "chatbot_contact_members_phoneUserId_fkey";

-- RenameForeignKey
-- ALTER TABLE "chatbot_phone_otps" RENAME CONSTRAINT "chatbot_phone_otps_user_id_fkey" TO "chatbot_phone_otps_userId_fkey";

-- RenameForeignKey
-- ALTER TABLE "chatbot_phone_sessions" RENAME CONSTRAINT "chatbot_phone_sessions_user_id_fkey" TO "chatbot_phone_sessions_userId_fkey";

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "tenant_user_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "schedule_templates" ADD CONSTRAINT "schedule_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ticket_comment_attachments" ADD CONSTRAINT "ticket_comment_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ticket_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_config" ADD CONSTRAINT "communication_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_channel_settings" ADD CONSTRAINT "communication_channel_settings_configId_fkey" FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_configId_fkey" FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_template_translations" ADD CONSTRAINT "communication_template_translations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_workflows" ADD CONSTRAINT "communication_workflows_configId_fkey" FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_workflow_steps" ADD CONSTRAINT "communication_workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "communication_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_workflow_steps" ADD CONSTRAINT "communication_workflow_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_configId_fkey" FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_components" ADD CONSTRAINT "communication_components_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "communication_component_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_template_components" ADD CONSTRAINT "communication_template_components_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "communication_template_components" ADD CONSTRAINT "communication_template_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "communication_components"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; WHEN foreign_key_violation THEN null; END $$;

-- RenameIndex
-- ALTER INDEX "chatbot_contact_members_contact_idx" RENAME TO "chatbot_contact_members_contactId_idx";

-- RenameIndex
-- ALTER INDEX "chatbot_contacts_tenant_idx" RENAME TO "chatbot_contacts_tenantId_idx";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_otps_expires_at_idx" RENAME TO "chatbot_phone_otps_expiresAt_idx";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_otps_public_id_key" RENAME TO "chatbot_phone_otps_publicId_key";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_otps_user_id_idx" RENAME TO "chatbot_phone_otps_userId_idx";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_sessions_expires_at_idx" RENAME TO "chatbot_phone_sessions_expiresAt_idx";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_sessions_session_token_key" RENAME TO "chatbot_phone_sessions_sessionToken_key";

-- RenameIndex
-- ALTER INDEX "chatbot_phone_sessions_user_id_idx" RENAME TO "chatbot_phone_sessions_userId_idx";

-- RenameIndex
-- ALTER INDEX "unique_phone_tenant" RENAME TO "chatbot_phone_users_normalizedPhone_tenantId_key";

-- RenameIndex
-- ALTER INDEX "communication_channel_settings_unique_channel" RENAME TO "communication_channel_settings_configId_channel_key";

-- RenameIndex
-- ALTER INDEX "communication_template_components_template_sort_idx" RENAME TO "communication_template_components_templateId_sortOrder_idx";

-- RenameIndex
-- ALTER INDEX "communication_template_translations_language_unique" RENAME TO "communication_template_translations_templateId_language_key";

-- RenameIndex
-- ALTER INDEX "communication_templates_key_config_unique" RENAME TO "communication_templates_templateKey_configId_key";

-- RenameIndex
-- ALTER INDEX "communication_workflow_steps_workflow_order_idx" RENAME TO "communication_workflow_steps_workflowId_order_idx";

-- RenameIndex
-- ALTER INDEX "communication_workflows_key_config_unique" RENAME TO "communication_workflows_workflowKey_configId_key";

-- RenameIndex
-- ALTER INDEX "departments_tenant_name_unique" RENAME TO "departments_tenantId_name_key";

-- RenameIndex
-- ALTER INDEX "tenant_user_chat_messages_thread_idx" RENAME TO "tenant_user_chat_messages_tenantId_threadKey_createdAt_idx";

-- Ensure chat_attachments has required columns
ALTER TABLE "chat_attachments" ADD COLUMN IF NOT EXISTS "data" TEXT;
ALTER TABLE "chat_attachments" ALTER COLUMN "messageId" DROP NOT NULL;
ALTER TABLE "chat_attachments" ALTER COLUMN "url" DROP NOT NULL;
