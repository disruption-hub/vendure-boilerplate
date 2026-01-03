-- Create table to manage per-user access to chat contacts
CREATE TABLE "chatbot_contact_access" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "phoneUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chatbot_contact_access_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chatbot_contact_access_contactId_fkey" FOREIGN KEY ("contactId")
    REFERENCES "chatbot_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chatbot_contact_access_phoneUserId_fkey" FOREIGN KEY ("phoneUserId")
    REFERENCES "chatbot_phone_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "chatbot_contact_access_contactId_phoneUserId_key"
  ON "chatbot_contact_access" ("contactId", "phoneUserId");

CREATE INDEX "chatbot_contact_access_tenantId_phoneUserId_idx"
  ON "chatbot_contact_access" ("tenantId", "phoneUserId");

CREATE INDEX "chatbot_contact_access_tenantId_contactId_idx"
  ON "chatbot_contact_access" ("tenantId", "contactId");
