-- Create table for chatbot phone users
CREATE TABLE "chatbot_phone_users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalized_phone" TEXT NOT NULL,
    "country_code" VARCHAR(8),
    "language" VARCHAR(10),
    "tenant_id" TEXT,
    "display_name" TEXT,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chatbot_phone_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chatbot_phone_users_normalized_phone_tenant_id_key"
    ON "chatbot_phone_users" ("normalized_phone", "tenant_id");

CREATE INDEX "chatbot_phone_users_phone_idx"
    ON "chatbot_phone_users" ("phone");

-- Create table for OTP records
CREATE TABLE "chatbot_phone_otps" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chatbot_phone_otps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chatbot_phone_otps_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "chatbot_phone_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "chatbot_phone_otps_public_id_key"
    ON "chatbot_phone_otps" ("public_id");

CREATE INDEX "chatbot_phone_otps_user_id_idx"
    ON "chatbot_phone_otps" ("user_id");

CREATE INDEX "chatbot_phone_otps_expires_at_idx"
    ON "chatbot_phone_otps" ("expires_at");

-- Create table for persistent sessions
CREATE TABLE "chatbot_phone_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chatbot_phone_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chatbot_phone_sessions_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "chatbot_phone_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "chatbot_phone_sessions_session_token_key"
    ON "chatbot_phone_sessions" ("session_token");

CREATE INDEX "chatbot_phone_sessions_user_id_idx"
    ON "chatbot_phone_sessions" ("user_id");

CREATE INDEX "chatbot_phone_sessions_expires_at_idx"
    ON "chatbot_phone_sessions" ("expires_at");
