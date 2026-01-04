-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'room';

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "amenities" JSONB;

-- CreateTable
CREATE TABLE "SpacePreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "amenities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpacePreset_pkey" PRIMARY KEY ("id")
);
