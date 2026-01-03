-- Create component categories table
CREATE TABLE IF NOT EXISTS "communication_component_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "icon" VARCHAR(120),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create reusable communication components
CREATE TABLE IF NOT EXISTS "communication_components" (
  "id" SERIAL PRIMARY KEY,
  "categoryId" INTEGER,
  "componentKey" VARCHAR(160) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "channel" "CommunicationChannelType",
  "componentType" VARCHAR(64) NOT NULL,
  "markup" TEXT,
  "content" JSONB,
  "variables" JSONB,
  "metadata" JSONB,
  "previewImage" VARCHAR(512),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_components_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "communication_component_categories"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_components_componentKey_key"
  ON "communication_components" ("componentKey");

-- Create template composition join table
CREATE TABLE IF NOT EXISTS "communication_template_components" (
  "id" SERIAL PRIMARY KEY,
  "templateId" INTEGER NOT NULL,
  "componentId" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "slot" VARCHAR(120),
  "settings" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_template_components_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "communication_template_components_componentId_fkey"
    FOREIGN KEY ("componentId") REFERENCES "communication_components"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "communication_template_components_template_sort_idx"
  ON "communication_template_components" ("templateId", "sortOrder");
