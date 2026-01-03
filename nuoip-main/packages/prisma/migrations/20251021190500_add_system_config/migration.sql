-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- Seed initial Brevo configuration
INSERT INTO "system_config" ("id", "key", "value")
VALUES (
    'config_brevo_email',
    'brevo_email',
    jsonb_build_object(
        'apiKey', 'REPLACE_WITH_YOUR_BREVO_API_KEY',
        'ccEmail', 'alberto@matmax.world'
    )
);
