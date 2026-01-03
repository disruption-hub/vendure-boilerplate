-- Ensure enums used by user management exist
DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('invited', 'active', 'suspended', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "TenantApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "ChatbotAccessStatus" AS ENUM ('pending', 'approved', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Expand users table with approval workflow and contact fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'invited',
  ADD COLUMN IF NOT EXISTS "approvalStatus" "TenantApprovalStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "approvalMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalUpdatedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "invitedById" TEXT,
  ADD COLUMN IF NOT EXISTS "profilePictureUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "normalizedPhone" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "phoneCountryCode" VARCHAR(8),
  ADD COLUMN IF NOT EXISTS "chatbotAccessStatus" "ChatbotAccessStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "chatbotApprovedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "chatbotRevokedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "chatbotPhoneUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "lastChatbotInteractionAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "preferredLanguage" VARCHAR(10) NOT NULL DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Fix enum type conversions by dropping defaults first
ALTER TABLE "users"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "approvalStatus" DROP DEFAULT,
  ALTER COLUMN "chatbotAccessStatus" DROP DEFAULT;

ALTER TABLE "users"
  ALTER COLUMN "status" TYPE "UserStatus" USING "status"::"UserStatus",
  ALTER COLUMN "status" SET DEFAULT 'invited',
  ALTER COLUMN "approvalStatus" TYPE "TenantApprovalStatus" USING "approvalStatus"::"TenantApprovalStatus",
  ALTER COLUMN "approvalStatus" SET DEFAULT 'pending',
  ALTER COLUMN "chatbotAccessStatus" TYPE "ChatbotAccessStatus" USING "chatbotAccessStatus"::"ChatbotAccessStatus",
  ALTER COLUMN "chatbotAccessStatus" SET DEFAULT 'pending',
  ALTER COLUMN "preferredLanguage" SET DEFAULT 'es';

UPDATE "users"
SET "preferredLanguage" = COALESCE("preferredLanguage", 'es');

CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_normalizedPhone_key"
  ON "users" ("tenantId", "normalizedPhone")
  WHERE "normalizedPhone" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "users_tenantId_chatbotPhoneUserId_idx"
  ON "users" ("tenantId", "chatbotPhoneUserId");

CREATE INDEX IF NOT EXISTS "users_tenantId_approvalStatus_idx"
  ON "users" ("tenantId", "approvalStatus");

CREATE INDEX IF NOT EXISTS "users_tenantId_status_idx"
  ON "users" ("tenantId", "status");

CREATE INDEX IF NOT EXISTS "users_tenantId_chatbotAccessStatus_idx"
  ON "users" ("tenantId", "chatbotAccessStatus");

DO $$
BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_invitedById_fkey"
      FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_chatbotPhoneUserId_fkey"
      FOREIGN KEY ("chatbotPhoneUserId") REFERENCES "chatbot_phone_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Normalize chatbot phone user columns to camelCase expected by Prisma schema
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "normalized_phone" TO "normalizedPhone";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "country_code" TO "countryCode";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "display_name" TO "displayName";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "last_active_at" TO "lastActiveAt";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "chatbot_phone_users" RENAME COLUMN "updated_at" TO "updatedAt";

ALTER TABLE "chatbot_phone_users"
  ALTER COLUMN "email" TYPE VARCHAR(320),
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "chatbot_phone_users_normalized_phone_tenant_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_phone_tenant"
  ON "chatbot_phone_users" ("normalizedPhone", "tenantId");

DROP INDEX IF EXISTS "chatbot_phone_users_phone_idx";
CREATE INDEX IF NOT EXISTS "chatbot_phone_users_phone_idx"
  ON "chatbot_phone_users" ("phone");

-- Normalize chatbot phone OTP columns
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "public_id" TO "publicId";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "code_hash" TO "codeHash";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "expires_at" TO "expiresAt";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "verified_at" TO "verifiedAt";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "attempt_count" TO "attemptCount";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "chatbot_phone_otps" RENAME COLUMN "updated_at" TO "updatedAt";

ALTER TABLE "chatbot_phone_otps"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "chatbot_phone_otps_public_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_phone_otps_public_id_key"
  ON "chatbot_phone_otps" ("publicId");

DROP INDEX IF EXISTS "chatbot_phone_otps_user_id_idx";
CREATE INDEX IF NOT EXISTS "chatbot_phone_otps_user_id_idx"
  ON "chatbot_phone_otps" ("userId");

DROP INDEX IF EXISTS "chatbot_phone_otps_expires_at_idx";
CREATE INDEX IF NOT EXISTS "chatbot_phone_otps_expires_at_idx"
  ON "chatbot_phone_otps" ("expiresAt");

-- Normalize chatbot phone session columns
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "session_token" TO "sessionToken";
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "expires_at" TO "expiresAt";
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "last_used_at" TO "lastUsedAt";
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "revoked_at" TO "revokedAt";
ALTER TABLE "chatbot_phone_sessions" RENAME COLUMN "created_at" TO "createdAt";

ALTER TABLE "chatbot_phone_sessions"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "chatbot_phone_sessions_session_token_key";
CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_phone_sessions_session_token_key"
  ON "chatbot_phone_sessions" ("sessionToken");

DROP INDEX IF EXISTS "chatbot_phone_sessions_user_id_idx";
CREATE INDEX IF NOT EXISTS "chatbot_phone_sessions_user_id_idx"
  ON "chatbot_phone_sessions" ("userId");

DROP INDEX IF EXISTS "chatbot_phone_sessions_expires_at_idx";
CREATE INDEX IF NOT EXISTS "chatbot_phone_sessions_expires_at_idx"
  ON "chatbot_phone_sessions" ("expiresAt");

-- Normalize chatbot contacts columns
ALTER TABLE "chatbot_contacts" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "chatbot_contacts" RENAME COLUMN "display_name" TO "displayName";
ALTER TABLE "chatbot_contacts" RENAME COLUMN "avatar_url" TO "avatarUrl";
ALTER TABLE "chatbot_contacts" RENAME COLUMN "is_default_flowbot" TO "isDefaultFlowbot";
ALTER TABLE "chatbot_contacts" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "chatbot_contacts" RENAME COLUMN "updated_at" TO "updatedAt";

ALTER TABLE "chatbot_contacts"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "chatbot_contacts_tenant_idx";
CREATE INDEX IF NOT EXISTS "chatbot_contacts_tenant_idx"
  ON "chatbot_contacts" ("tenantId");

DROP INDEX IF EXISTS "chatbot_contacts_type_idx";
CREATE INDEX IF NOT EXISTS "chatbot_contacts_type_idx"
  ON "chatbot_contacts" ("type");

DROP INDEX IF EXISTS "chatbot_contacts_flowbot_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_contacts_flowbot_unique"
  ON "chatbot_contacts" ("tenantId")
  WHERE "isDefaultFlowbot" = TRUE;

-- Normalize chatbot contact member columns
ALTER TABLE "chatbot_contact_members" RENAME COLUMN "contact_id" TO "contactId";
ALTER TABLE "chatbot_contact_members" RENAME COLUMN "phone_user_id" TO "phoneUserId";
ALTER TABLE "chatbot_contact_members" RENAME COLUMN "member_name" TO "memberName";
ALTER TABLE "chatbot_contact_members" RENAME COLUMN "member_phone" TO "memberPhone";
ALTER TABLE "chatbot_contact_members" RENAME COLUMN "created_at" TO "createdAt";

ALTER TABLE "chatbot_contact_members"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "chatbot_contact_members_contact_idx";
CREATE INDEX IF NOT EXISTS "chatbot_contact_members_contact_idx"
  ON "chatbot_contact_members" ("contactId");
