/*
  Warnings:

  - You are about to drop the column `NumberOfOrders` on the `provider` table. All the data in the column will be lost.
  - Added the required column `CompanyName` to the `provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."provider" DROP COLUMN "NumberOfOrders",
ADD COLUMN     "CompanyName" TEXT NOT NULL;
