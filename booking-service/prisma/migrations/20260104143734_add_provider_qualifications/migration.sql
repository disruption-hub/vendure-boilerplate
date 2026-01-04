-- CreateTable
CREATE TABLE "_ProviderVenueQualifications" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProviderVenueQualifications_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProviderSpaceQualifications" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProviderSpaceQualifications_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProviderVenueQualifications_B_index" ON "_ProviderVenueQualifications"("B");

-- CreateIndex
CREATE INDEX "_ProviderSpaceQualifications_B_index" ON "_ProviderSpaceQualifications"("B");

-- AddForeignKey
ALTER TABLE "_ProviderVenueQualifications" ADD CONSTRAINT "_ProviderVenueQualifications_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderVenueQualifications" ADD CONSTRAINT "_ProviderVenueQualifications_B_fkey" FOREIGN KEY ("B") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderSpaceQualifications" ADD CONSTRAINT "_ProviderSpaceQualifications_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderSpaceQualifications" ADD CONSTRAINT "_ProviderSpaceQualifications_B_fkey" FOREIGN KEY ("B") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
