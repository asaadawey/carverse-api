/*
  Warnings:

  - Added the required column `ProviderNetProfit` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "ProviderNetProfit" DOUBLE PRECISION NOT NULL;
