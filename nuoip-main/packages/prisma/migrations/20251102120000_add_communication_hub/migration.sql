-- Create enums for communication hub
DO $$
BEGIN
  CREATE TYPE "CommunicationChannelType" AS ENUM ('EMAIL', 'SMS', 'TELEGRAM', 'WHATSAPP', 'INSTAGRAM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "CommunicationProviderType" AS ENUM ('BREVO', 'RESEND', 'LABSMOBILE', 'TELEGRAM_BOT', 'WHATSAPP_CLOUD', 'INSTAGRAM_GRAPH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "CommunicationLogStatus" AS ENUM ('pending', 'sent', 'partial', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- communication_config table
CREATE TABLE IF NOT EXISTS "communication_config" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" TEXT,
  "name" VARCHAR(120),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "defaultFromEmail" VARCHAR(320),
  "defaultFromName" VARCHAR(160),
  "defaultReplyToEmail" VARCHAR(320),
  "adminEmail" VARCHAR(320),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_config_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "communication_config_tenant_idx"
  ON "communication_config" ("tenantId");

-- communication_channel_settings table
CREATE TABLE IF NOT EXISTS "communication_channel_settings" (
  "id" SERIAL PRIMARY KEY,
  "configId" INTEGER NOT NULL,
  "channel" "CommunicationChannelType" NOT NULL,
  "provider" "CommunicationProviderType" NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "credentials" JSONB,
  "settings" JSONB,
  "webhookUrl" VARCHAR(512),
  "externalId" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_channel_settings_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_channel_settings_unique_channel"
  ON "communication_channel_settings" ("configId", "channel");

-- communication_templates table
CREATE TABLE IF NOT EXISTS "communication_templates" (
  "id" SERIAL PRIMARY KEY,
  "configId" INTEGER,
  "templateKey" VARCHAR(150) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "channel" "CommunicationChannelType" NOT NULL,
  "category" VARCHAR(120),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_templates_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_templates_key_config_unique"
  ON "communication_templates" ("templateKey", "configId");

-- communication_template_translations table
CREATE TABLE IF NOT EXISTS "communication_template_translations" (
  "id" SERIAL PRIMARY KEY,
  "templateId" INTEGER NOT NULL,
  "language" VARCHAR(12) NOT NULL,
  "subject" VARCHAR(500),
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_template_translations_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_template_translations_language_unique"
  ON "communication_template_translations" ("templateId", "language");

-- communication_workflows table
CREATE TABLE IF NOT EXISTS "communication_workflows" (
  "id" SERIAL PRIMARY KEY,
  "configId" INTEGER,
  "workflowKey" VARCHAR(150) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "triggerType" VARCHAR(120),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "rules" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_workflows_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_workflows_key_config_unique"
  ON "communication_workflows" ("workflowKey", "configId");

-- communication_workflow_steps table
CREATE TABLE IF NOT EXISTS "communication_workflow_steps" (
  "id" SERIAL PRIMARY KEY,
  "workflowId" INTEGER NOT NULL,
  "templateId" INTEGER,
  "stepType" VARCHAR(120) NOT NULL,
  "channel" "CommunicationChannelType" NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "settings" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_workflow_steps_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES "communication_workflows"("id") ON DELETE CASCADE,
  CONSTRAINT "communication_workflow_steps_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "communication_workflow_steps_workflow_order_idx"
  ON "communication_workflow_steps" ("workflowId", "order");

-- communication_logs table
CREATE TABLE IF NOT EXISTS "communication_logs" (
  "id" TEXT PRIMARY KEY,
  "configId" INTEGER,
  "templateId" INTEGER,
  "tenantId" TEXT,
  "sentById" TEXT,
  "channel" "CommunicationChannelType" NOT NULL,
  "provider" "CommunicationProviderType",
  "status" "CommunicationLogStatus" NOT NULL DEFAULT 'pending',
  "recipients" JSONB NOT NULL,
  "subject" VARCHAR(512),
  "content" JSONB,
  "errorCode" VARCHAR(120),
  "errorMessage" TEXT,
  "metadata" JSONB,
  "sentAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_logs_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "communication_config"("id") ON DELETE SET NULL,
  CONSTRAINT "communication_logs_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL,
  CONSTRAINT "communication_logs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL,
  CONSTRAINT "communication_logs_sentById_fkey"
    FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "communication_logs_channel_idx"
  ON "communication_logs" ("channel");

CREATE INDEX IF NOT EXISTS "communication_logs_status_idx"
  ON "communication_logs" ("status");

CREATE INDEX IF NOT EXISTS "communication_logs_sentAt_idx"
  ON "communication_logs" ("sentAt");
