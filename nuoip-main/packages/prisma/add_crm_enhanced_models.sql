-- Create CRM Task Priority Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "CrmTaskPriority" AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Task Type Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "CrmTaskType" AS ENUM ('general', 'followup', 'call', 'meeting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Appointment Type Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "CrmAppointmentType" AS ENUM ('consultation', 'training', 'class', 'massage', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Appointment Status Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "CrmAppointmentStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Activity Type Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "CrmActivityType" AS ENUM ('message', 'call', 'email', 'note', 'ticket', 'product', 'appointment', 'task');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Tasks Table (if not exists)
CREATE TABLE IF NOT EXISTS "crm_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" VARCHAR(8),
    "priority" "CrmTaskPriority" NOT NULL DEFAULT 'medium',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "reminder" VARCHAR(16),
    "type" "CrmTaskType" NOT NULL DEFAULT 'general',
    "clientName" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- Create CRM Appointments Table (if not exists)
CREATE TABLE IF NOT EXISTS "crm_appointments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "clientName" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" VARCHAR(8) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" "CrmAppointmentType" NOT NULL DEFAULT 'consultation',
    "status" "CrmAppointmentStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_appointments_pkey" PRIMARY KEY ("id")
);

-- Create CRM Activities Table (if not exists)
CREATE TABLE IF NOT EXISTS "crm_activities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "type" "CrmActivityType" NOT NULL,
    "text" TEXT NOT NULL,
    "detail" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- Create CRM Session Summaries Table (if not exists)
CREATE TABLE IF NOT EXISTS "crm_session_summaries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "clientName" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" VARCHAR(32),
    "summary" TEXT NOT NULL,
    "topics" TEXT[],
    "sentiment" VARCHAR(32),
    "nextActions" TEXT[],
    "aiInsights" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpTime" VARCHAR(8),
    "followUpNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_session_summaries_pkey" PRIMARY KEY ("id")
);

-- Create Indexes for CRM Tasks (if not exist)
CREATE INDEX IF NOT EXISTS "crm_tasks_tenantId_completed_idx" ON "crm_tasks"("tenantId", "completed");
CREATE INDEX IF NOT EXISTS "crm_tasks_tenantId_dueDate_idx" ON "crm_tasks"("tenantId", "dueDate");
CREATE INDEX IF NOT EXISTS "crm_tasks_tenantId_contactId_idx" ON "crm_tasks"("tenantId", "contactId");

-- Create Indexes for CRM Appointments (if not exist)
CREATE INDEX IF NOT EXISTS "crm_appointments_tenantId_date_idx" ON "crm_appointments"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "crm_appointments_tenantId_contactId_idx" ON "crm_appointments"("tenantId", "contactId");
CREATE INDEX IF NOT EXISTS "crm_appointments_tenantId_status_idx" ON "crm_appointments"("tenantId", "status");

-- Create Indexes for CRM Activities (if not exist)
CREATE INDEX IF NOT EXISTS "crm_activities_tenantId_createdAt_idx" ON "crm_activities"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_activities_tenantId_contactId_idx" ON "crm_activities"("tenantId", "contactId");

-- Create Indexes for CRM Session Summaries (if not exist)
CREATE INDEX IF NOT EXISTS "crm_session_summaries_tenantId_createdAt_idx" ON "crm_session_summaries"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "crm_session_summaries_tenantId_contactId_idx" ON "crm_session_summaries"("tenantId", "contactId");
