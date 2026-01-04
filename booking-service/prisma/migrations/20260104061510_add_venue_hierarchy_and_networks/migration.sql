-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "networkId" TEXT,
ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "VenueNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PassNetworkValidity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PassNetworkValidity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PassVenueValidity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PassVenueValidity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PassNetworkValidity_B_index" ON "_PassNetworkValidity"("B");

-- CreateIndex
CREATE INDEX "_PassVenueValidity_B_index" ON "_PassVenueValidity"("B");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "VenueNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PassNetworkValidity" ADD CONSTRAINT "_PassNetworkValidity_A_fkey" FOREIGN KEY ("A") REFERENCES "PassTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PassNetworkValidity" ADD CONSTRAINT "_PassNetworkValidity_B_fkey" FOREIGN KEY ("B") REFERENCES "VenueNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PassVenueValidity" ADD CONSTRAINT "_PassVenueValidity_A_fkey" FOREIGN KEY ("A") REFERENCES "PassTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PassVenueValidity" ADD CONSTRAINT "_PassVenueValidity_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
