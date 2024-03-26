/*
  Warnings:

  - You are about to drop the column `ServiceID` on the `orderServices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[PaymentIntentID]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ProviderServiceID` to the `orderServices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConstantType" AS ENUM ('Amount', 'Percentage', 'Numeric');

-- DropForeignKey
ALTER TABLE "orderServices" DROP CONSTRAINT "orderServices_ServiceID_fkey";

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "orderServices" DROP COLUMN "ServiceID",
ADD COLUMN     "ProviderServiceID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "AdditionalAddressData" JSONB,
ADD COLUMN     "PaymentIntentID" TEXT;

-- AlterTable
ALTER TABLE "packages" ALTER COLUMN "GradiantID" DROP NOT NULL;

-- AlterTable
ALTER TABLE "paymentMethods" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "GradientID" DROP NOT NULL;

-- AlterTable
ALTER TABLE "userTypes" ADD COLUMN     "AllowedClients" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "attachmentTypes" (
    "id" SERIAL NOT NULL,
    "TypeName" TEXT NOT NULL,

    CONSTRAINT "attachmentTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "TypeID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploadedFiles" (
    "id" SERIAL NOT NULL,
    "AttachmentID" INTEGER NOT NULL,
    "UserID" INTEGER NOT NULL,
    "FileName" TEXT NOT NULL,
    "AWSEtag" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UploadedAt" TIMESTAMP(3),
    "JsonData" JSONB,

    CONSTRAINT "uploadedFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constants" (
    "id" SERIAL NOT NULL,
    "Value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "Type" "ConstantType" NOT NULL,
    "Label" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "Name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "constants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderAmountStatements" (
    "id" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "RelatedConstantID" INTEGER,
    "RelatedProviderServiceID" INTEGER,
    "Name" TEXT,
    "Amount" DECIMAL(65,30) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderAmountStatements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attachmentTypes_TypeName_key" ON "attachmentTypes"("TypeName");

-- CreateIndex
CREATE UNIQUE INDEX "uploadedFiles_FileName_key" ON "uploadedFiles"("FileName");

-- CreateIndex
CREATE UNIQUE INDEX "constants_Name_key" ON "constants"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "orders_PaymentIntentID_key" ON "orders"("PaymentIntentID");

-- AddForeignKey
ALTER TABLE "orderServices" ADD CONSTRAINT "orderServices_ServiceID_fkey" FOREIGN KEY ("ProviderServiceID") REFERENCES "providerServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_TypeID_fkey" FOREIGN KEY ("TypeID") REFERENCES "attachmentTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploadedFiles" ADD CONSTRAINT "uploadedFiles_AttachmentID_fkey" FOREIGN KEY ("AttachmentID") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploadedFiles" ADD CONSTRAINT "uploadedFiles_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedConstantID_fkey" FOREIGN KEY ("RelatedConstantID") REFERENCES "constants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedProviderServiceID_fkey" FOREIGN KEY ("RelatedProviderServiceID") REFERENCES "providerServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
