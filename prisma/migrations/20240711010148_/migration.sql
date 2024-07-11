/*
  Warnings:

  - You are about to drop the column `ProviderServiceID` on the `orderServices` table. All the data in the column will be lost.
  - You are about to drop the column `Price` on the `providerServices` table. All the data in the column will be lost.
  - Added the required column `ProviderServiceBodyTypeID` to the `orderServices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orderAmountStatements" DROP CONSTRAINT "orderAmountStatements_RelatedProviderServiceID_fkey";

-- DropForeignKey
ALTER TABLE "orderServices" DROP CONSTRAINT "orderServices_ServiceID_fkey";

-- AlterTable
ALTER TABLE "orderServices" DROP COLUMN "ProviderServiceID",
ADD COLUMN     "ProviderServiceBodyTypeID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "providerServices" DROP COLUMN "Price";

-- CreateTable
CREATE TABLE "providerServicesAllowedBodyTypes" (
    "id" SERIAL NOT NULL,
    "ProviderServiceID" INTEGER NOT NULL,
    "BodyTypeID" INTEGER NOT NULL,
    "Price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "providerServicesAllowedBodyTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providerServicesAllowedBodyTypes_ProviderServiceID_BodyType_key" ON "providerServicesAllowedBodyTypes"("ProviderServiceID", "BodyTypeID");

-- AddForeignKey
ALTER TABLE "orderServices" ADD CONSTRAINT "orderServices_ProviderServiceBodyTypeID_fkey" FOREIGN KEY ("ProviderServiceBodyTypeID") REFERENCES "providerServicesAllowedBodyTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerServicesAllowedBodyTypes" ADD CONSTRAINT "providerServicesAllowedBodyTypes_ProviderServiceID_fkey" FOREIGN KEY ("ProviderServiceID") REFERENCES "providerServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerServicesAllowedBodyTypes" ADD CONSTRAINT "providerServicesAllowedBodyTypes_BodyTypeID_fkey" FOREIGN KEY ("BodyTypeID") REFERENCES "bodyTypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedProviderServiceID_fkey" FOREIGN KEY ("RelatedProviderServiceID") REFERENCES "providerServicesAllowedBodyTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
