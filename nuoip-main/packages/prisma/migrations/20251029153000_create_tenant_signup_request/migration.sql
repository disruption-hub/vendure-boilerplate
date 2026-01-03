CREATE TABLE "tenant_signup_requests" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "desiredSubdomain" TEXT NOT NULL,
    "activationToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_signup_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_signup_requests_desiredSubdomain_key" ON "tenant_signup_requests"("desiredSubdomain");

CREATE UNIQUE INDEX "tenant_signup_requests_activationToken_key" ON "tenant_signup_requests"("activationToken");
