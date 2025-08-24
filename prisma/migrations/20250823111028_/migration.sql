/*
  Warnings:

  - Added the required column `Label` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."vouchers" ADD COLUMN     "Label" TEXT NOT NULL;
