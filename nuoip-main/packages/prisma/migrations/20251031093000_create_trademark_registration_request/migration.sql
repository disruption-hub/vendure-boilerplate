-- Create table for trademark registration requests
CREATE TABLE "trademark_registration_requests" (
  "id" TEXT NOT NULL,
  "brandName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "description" TEXT,
  "classes" TEXT,
  "similarMatches" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "source" TEXT NOT NULL DEFAULT 'chatbot',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trademark_registration_requests_pkey" PRIMARY KEY ("id")
);

-- Index for brand lookups
CREATE INDEX "trademark_registration_requests_brandName_idx"
ON "trademark_registration_requests" ("brandName");
