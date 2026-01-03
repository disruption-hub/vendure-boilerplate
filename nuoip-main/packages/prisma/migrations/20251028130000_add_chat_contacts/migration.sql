-- Create enum for contact types
CREATE TYPE "ChatbotContactType" AS ENUM ('BOT', 'CONTACT', 'GROUP');

-- Add email column to chatbot phone users if it does not exist
ALTER TABLE "chatbot_phone_users"
ADD COLUMN "email" TEXT;

-- Create contacts table
CREATE TABLE "chatbot_contacts" (
    "id" TEXT PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "type" "ChatbotContactType" NOT NULL DEFAULT 'CONTACT',
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "is_default_flowbot" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "chatbot_contacts_tenant_idx" ON "chatbot_contacts" ("tenant_id");
CREATE INDEX "chatbot_contacts_type_idx" ON "chatbot_contacts" ("type");

-- Ensure only one default FlowBot contact per tenant
CREATE UNIQUE INDEX "chatbot_contacts_flowbot_unique"
ON "chatbot_contacts" ("tenant_id")
WHERE "is_default_flowbot" = TRUE;

-- Create contact members table
CREATE TABLE "chatbot_contact_members" (
    "id" TEXT PRIMARY KEY,
    "contact_id" TEXT NOT NULL,
    "phone_user_id" TEXT,
    "member_name" TEXT,
    "member_phone" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "chatbot_contact_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "chatbot_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chatbot_contact_members_phone_user_id_fkey" FOREIGN KEY ("phone_user_id") REFERENCES "chatbot_phone_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "chatbot_contact_members_contact_idx" ON "chatbot_contact_members" ("contact_id");
