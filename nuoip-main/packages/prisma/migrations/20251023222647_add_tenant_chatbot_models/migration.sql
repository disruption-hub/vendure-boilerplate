/*
  Warnings:

  - You are about to drop the column `base_amount_cents` on the `payment_links` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount_cents` on the `payment_links` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `payment_links` table. All the data in the column will be lost.
  - You are about to drop the column `tax_rate_bps` on the `payment_links` table. All the data in the column will be lost.
  - You are about to drop the column `base_amount_cents` on the `payment_products` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount_cents` on the `payment_products` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `payment_products` table. All the data in the column will be lost.
  - You are about to drop the column `country_code` on the `payment_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `payment_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `payment_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `rate_bps` on the `payment_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `payment_taxes` table. All the data in the column will be lost.
  - You are about to drop the `Trademark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productCode]` on the table `payment_products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseAmountCents` to the `payment_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseAmountCents` to the `payment_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `payment_taxes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rateBps` to the `payment_taxes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `payment_taxes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('blocked', 'modified', 'additional');

-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Trademark" DROP CONSTRAINT "Trademark_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_links" DROP CONSTRAINT "payment_links_tax_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_products" DROP CONSTRAINT "payment_products_tax_id_fkey";

-- DropIndex
DROP INDEX "public"."application_requests_createdAt_idx";

-- DropIndex
DROP INDEX "public"."payment_links_tax_id_idx";

-- DropIndex
DROP INDEX "public"."payment_products_tax_id_idx";

-- DropIndex (only if exists - may not exist if vector extension was unavailable)
DROP INDEX IF EXISTS "public"."trademark_registry_search_embedding_idx";

-- AlterTable
ALTER TABLE "payment_links" DROP COLUMN "base_amount_cents",
DROP COLUMN "tax_amount_cents",
DROP COLUMN "tax_id",
DROP COLUMN "tax_rate_bps",
ADD COLUMN     "baseAmountCents" INTEGER NOT NULL,
ADD COLUMN     "taxAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "taxRateBps" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_products" DROP COLUMN "base_amount_cents",
DROP COLUMN "tax_amount_cents",
DROP COLUMN "tax_id",
ADD COLUMN     "baseAmountCents" INTEGER NOT NULL,
ADD COLUMN     "taxAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_taxes" DROP COLUMN "country_code",
DROP COLUMN "created_at",
DROP COLUMN "is_default",
DROP COLUMN "rate_bps",
DROP COLUMN "updated_at",
ADD COLUMN     "countryCode" VARCHAR(3) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rateBps" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "system_config" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "calendarSettings" JSONB,
ADD COLUMN     "chatbotConfig" JSONB,
ALTER COLUMN "settings" DROP NOT NULL,
ALTER COLUMN "settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "trademark_registry" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."Trademark";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "language" VARCHAR(10) DEFAULT 'en',
    "theme" VARCHAR(20) DEFAULT 'dark',
    "calendarConfig" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trademarks" (
    "id" TEXT NOT NULL,
    "expediente" TEXT,
    "marca" TEXT,
    "clase" TEXT,
    "titular" TEXT,
    "paisTitular" TEXT,
    "estado" TEXT,
    "fechaRegistro" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "descripcion" TEXT,
    "numeroRegistro" TEXT,
    "fechaPresentacion" TIMESTAMP(3),
    "agente" TEXT,
    "tipoSolicitud" TEXT,
    "productosServicios" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trademarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buffer_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buffer_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_summaries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_entities" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "context" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "lastMentioned" TIMESTAMP(3),

    CONSTRAINT "memory_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_relationships" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "strength" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recurringType" "RecurringType" NOT NULL,
    "recurringDays" INTEGER[],
    "timeZone" TEXT NOT NULL DEFAULT 'America/Mexico_City',

    CONSTRAINT "schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "bufferTime" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxBookings" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "exceptionType" "ExceptionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "newStartTime" TEXT,
    "newEndTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "satisfaction" INTEGER,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_training" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_filters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_tools" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "authentication" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_analytics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalConversations" INTEGER NOT NULL,
    "averageSatisfaction" DOUBLE PRECISION,
    "topTags" TEXT[],
    "escalationCount" INTEGER NOT NULL,
    "toolUsage" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_tenantId_key" ON "users"("email", "tenantId");

-- CreateIndex
CREATE INDEX "trademarks_tenantId_idx" ON "trademarks"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_sessions_sessionId_tenantId_key" ON "memory_sessions"("sessionId", "tenantId");

-- CreateIndex
CREATE INDEX "buffer_messages_sessionId_idx" ON "buffer_messages"("sessionId");

-- CreateIndex
CREATE INDEX "conversation_logs_tenantId_createdAt_idx" ON "conversation_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_logs_userId_createdAt_idx" ON "conversation_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "chatbot_training_tenantId_type_idx" ON "chatbot_training"("tenantId", "type");

-- CreateIndex
CREATE INDEX "content_filters_tenantId_type_idx" ON "content_filters"("tenantId", "type");

-- CreateIndex
CREATE INDEX "escalation_rules_tenantId_priority_idx" ON "escalation_rules"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "custom_tools_tenantId_name_idx" ON "custom_tools"("tenantId", "name");

-- CreateIndex
CREATE INDEX "chatbot_analytics_tenantId_date_idx" ON "chatbot_analytics"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_analytics_tenantId_date_key" ON "chatbot_analytics"("tenantId", "date");

-- CreateIndex
CREATE INDEX "chatbot_feedback_tenantId_rating_idx" ON "chatbot_feedback"("tenantId", "rating");

-- CreateIndex
CREATE INDEX "chatbot_feedback_userId_createdAt_idx" ON "chatbot_feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_links_token_idx" ON "payment_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "payment_products_productCode_key" ON "payment_products"("productCode");

-- CreateIndex
CREATE INDEX "payment_products_taxId_idx" ON "payment_products"("taxId");

-- CreateIndex
CREATE INDEX "payment_taxes_countryCode_currency_idx" ON "payment_taxes"("countryCode", "currency");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_products" ADD CONSTRAINT "payment_products_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "payment_taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "payment_taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_logs" ADD CONSTRAINT "conversation_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_training" ADD CONSTRAINT "chatbot_training_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_filters" ADD CONSTRAINT "content_filters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_rules" ADD CONSTRAINT "escalation_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_tools" ADD CONSTRAINT "custom_tools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_analytics" ADD CONSTRAINT "chatbot_analytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_feedback" ADD CONSTRAINT "chatbot_feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
