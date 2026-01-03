-- CreateExtension (optional - only if available)
DO $$
BEGIN
CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    -- Extension not available, skip it
    RAISE NOTICE 'Vector extension not available, skipping. Error: %', SQLERRM;
END
$$;

-- CreateTable (with optional vector column)
DO $$
BEGIN
CREATE TABLE "trademark_registry" (
    "id" TEXT NOT NULL,
    "row_number" INTEGER,
    "expediente_number" TEXT,
    "expediente_year" INTEGER,
    "certificate_number" TEXT,
    "class_code" TEXT,
    "filing_date" TIMESTAMP(3),
    "intake_date" TIMESTAMP(3),
    "presentation_code" TEXT,
    "expedient_type" TEXT,
    "mark_type" TEXT,
    "denomination" TEXT,
    "country_code" TEXT,
    "expiration_date" TIMESTAMP(3),
    "product_service_details" TEXT,
    "conclusion_type" TEXT,
    "owner_names" TEXT,
    "owner_types" TEXT,
    "publication_date" TIMESTAMP(3),
    "resolution_date" TIMESTAMP(3),
    "resolution_number" TEXT,
    "renewal_expedient" TEXT,
    "modification_expedient" TEXT,
    "cancellation_expedient" TEXT,
    "search_document" TEXT,
    "search_embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trademark_registry_pkey" PRIMARY KEY ("id")
);
EXCEPTION
  WHEN undefined_object THEN
    -- Vector type not available, create table without vector column
    CREATE TABLE "trademark_registry" (
        "id" TEXT NOT NULL,
        "row_number" INTEGER,
        "expediente_number" TEXT,
        "expediente_year" INTEGER,
        "certificate_number" TEXT,
        "class_code" TEXT,
        "filing_date" TIMESTAMP(3),
        "intake_date" TIMESTAMP(3),
        "presentation_code" TEXT,
        "expedient_type" TEXT,
        "mark_type" TEXT,
        "denomination" TEXT,
        "country_code" TEXT,
        "expiration_date" TIMESTAMP(3),
        "product_service_details" TEXT,
        "conclusion_type" TEXT,
        "owner_names" TEXT,
        "owner_types" TEXT,
        "publication_date" TIMESTAMP(3),
        "resolution_date" TIMESTAMP(3),
        "resolution_number" TEXT,
        "renewal_expedient" TEXT,
        "modification_expedient" TEXT,
        "cancellation_expedient" TEXT,
        "search_document" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "trademark_registry_pkey" PRIMARY KEY ("id")
    );
  WHEN duplicate_table THEN
    RAISE NOTICE 'trademark_registry table already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating trademark_registry table: %', SQLERRM;
END
$$;

CREATE INDEX IF NOT EXISTS "trademark_registry_expediente_number_idx" ON "trademark_registry"("expediente_number");
CREATE INDEX IF NOT EXISTS "trademark_registry_denomination_idx" ON "trademark_registry"("denomination");

-- CreateIndex (only if vector extension is available)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS "trademark_registry_search_embedding_idx" ON "trademark_registry" USING ivfflat ("search_embedding" vector_l2_ops) WITH (lists = 100);
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Vector type not available, skipping search_embedding index';
  WHEN undefined_column THEN
    RAISE NOTICE 'search_embedding column does not exist, skipping index';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating search_embedding index: %', SQLERRM;
END
$$;
