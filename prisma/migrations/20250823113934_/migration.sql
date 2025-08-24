/*
  Warnings:

  - You are about to alter the column `DiscountAmount` on the `orderAmountStatements` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "public"."orderAmountStatements" ALTER COLUMN "DiscountAmount" SET DATA TYPE DECIMAL(65,30);
