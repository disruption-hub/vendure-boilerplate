DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments'
  ) THEN
    CREATE TABLE "departments" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenant_name_unique" ON "departments" ("tenantId", "name");
  END IF;
END $$;

-- Add departmentId to users if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'departmentId'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "departmentId" TEXT;
  END IF;
END $$;

-- Add departmentId to schedule_templates if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schedule_templates' AND column_name = 'departmentId'
  ) THEN
    ALTER TABLE "schedule_templates" ADD COLUMN "departmentId" TEXT;
  END IF;
END $$;

-- Add FK users.departmentId -> departments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'users' AND constraint_name = 'users_departmentId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add FK schedule_templates.departmentId -> departments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'schedule_templates' AND constraint_name = 'schedule_templates_departmentId_fkey'
  ) THEN
    ALTER TABLE "schedule_templates"
      ADD CONSTRAINT "schedule_templates_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

