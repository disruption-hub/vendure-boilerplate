-- CreateTable
CREATE TABLE "whatsapp_session_keys" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_session_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_session_keys_sessionId_idx" ON "whatsapp_session_keys"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_session_keys_sessionId_type_keyId_key" ON "whatsapp_session_keys"("sessionId", "type", "keyId");

-- AddForeignKey
ALTER TABLE "whatsapp_session_keys" ADD CONSTRAINT "whatsapp_session_keys_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whatsapp_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "whatsapp_sessions" DROP COLUMN IF EXISTS "keys";
