-- AlterTable
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "chatbotAccessStatus" VARCHAR(20) NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS "users_chatbot_access_status" ON "users" ("chatbotAccessStatus");
