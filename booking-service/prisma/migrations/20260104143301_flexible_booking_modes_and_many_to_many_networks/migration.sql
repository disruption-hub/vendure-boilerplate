/*
  Warnings:

  - You are about to drop the column `networkId` on the `Venue` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('SITE', 'UNIT', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('COMPLEX', 'NETWORK', 'FEDERATION');

-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('CAPACITY', 'SLOT', 'ENTIRE', 'HYBRID');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('MAT', 'BED', 'DESK', 'SEAT', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('GENERAL', 'SLOT_SPECIFIC', 'ENTIRE_SPACE');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('IN_PERSON', 'VIRTUAL');

-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_networkId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "accessMethod" "AccessMethod" NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN     "bookableSlotId" TEXT,
ADD COLUMN     "bookingType" "BookingType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "priceCharged" DECIMAL(10,2),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "virtualAccessInfo" JSONB;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "allowEntireSpaceBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "availableCapacity" INTEGER,
ADD COLUMN     "availableSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "bookingMode" "BookingMode" NOT NULL DEFAULT 'CAPACITY',
ADD COLUMN     "entireSpaceBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "entireSpacePrice" DECIMAL(10,2),
ADD COLUMN     "slotPrice" DECIMAL(10,2),
ADD COLUMN     "totalSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "virtualAccessDetails" JSONB,
ADD COLUMN     "virtualPlatform" TEXT;

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "activeBookingMode" "BookingMode" NOT NULL DEFAULT 'CAPACITY',
ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "entireSpacePrice" DECIMAL(10,2),
ADD COLUMN     "slotPrice" DECIMAL(10,2),
ADD COLUMN     "totalSlots" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "networkId",
ADD COLUMN     "type" "VenueType" NOT NULL DEFAULT 'UNIT';

-- AlterTable
ALTER TABLE "VenueNetwork" ADD COLUMN     "type" "NetworkType" NOT NULL DEFAULT 'NETWORK';

-- CreateTable
CREATE TABLE "SpaceSlot" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "slotIdentifier" TEXT NOT NULL,
    "slotType" "SlotType" NOT NULL DEFAULT 'MAT',
    "position" INTEGER,
    "attributes" JSONB,
    "pricingModifier" DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VenueToNetwork" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VenueToNetwork_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_VenueToNetwork_B_index" ON "_VenueToNetwork"("B");

-- AddForeignKey
ALTER TABLE "SpaceSlot" ADD CONSTRAINT "SpaceSlot_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookableSlotId_fkey" FOREIGN KEY ("bookableSlotId") REFERENCES "SpaceSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VenueToNetwork" ADD CONSTRAINT "_VenueToNetwork_A_fkey" FOREIGN KEY ("A") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VenueToNetwork" ADD CONSTRAINT "_VenueToNetwork_B_fkey" FOREIGN KEY ("B") REFERENCES "VenueNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
