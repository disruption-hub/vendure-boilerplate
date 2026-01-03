-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Trademark" (
    "id" TEXT NOT NULL,
    "expediente" TEXT,
    "fechaPresentacion" TIMESTAMP(3),
    "fechaRegistro" TIMESTAMP(3),
    "marca" TEXT,
    "clase" TEXT,
    "titular" TEXT,
    "paisTitular" TEXT,
    "direccionTitular" TEXT,
    "telefonoTitular" TEXT,
    "emailTitular" TEXT,
    "agente" TEXT,
    "tipoSolicitud" TEXT,
    "estado" TEXT,
    "descripcion" TEXT,
    "productosServicios" TEXT,
    "numeroRegistro" TEXT,
    "fechaPublicacion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "observaciones" TEXT,
    "marcaNormalized" TEXT,
    "titularNormalized" TEXT,
    "descripcionNormalized" TEXT,
    "searchVector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trademark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Trademark_expediente_key" ON "Trademark"("expediente");

-- CreateIndex
CREATE INDEX "Trademark_marcaNormalized_idx" ON "Trademark"("marcaNormalized");

-- CreateIndex
CREATE INDEX "Trademark_titularNormalized_idx" ON "Trademark"("titularNormalized");

-- CreateIndex
CREATE INDEX "Trademark_clase_idx" ON "Trademark"("clase");

-- CreateIndex
CREATE INDEX "Trademark_estado_idx" ON "Trademark"("estado");

-- CreateIndex
CREATE INDEX "Trademark_fechaPresentacion_idx" ON "Trademark"("fechaPresentacion");

-- CreateIndex
CREATE INDEX "Trademark_fechaRegistro_idx" ON "Trademark"("fechaRegistro");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
