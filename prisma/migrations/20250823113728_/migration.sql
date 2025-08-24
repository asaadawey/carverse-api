/*
  Warnings:

  - The `DiscountAmount` column on the `orderAmountStatements` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."orderAmountStatements" DROP COLUMN "DiscountAmount",
ADD COLUMN     "DiscountAmount" DOUBLE PRECISION;
