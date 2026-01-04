-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "profileId" TEXT;

-- CreateTable
CREATE TABLE "BookingProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metrics" JSONB,
    "uiConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingProfile_slug_key" ON "BookingProfile"("slug");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BookingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BookingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
