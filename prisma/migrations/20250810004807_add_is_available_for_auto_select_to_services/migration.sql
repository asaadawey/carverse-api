/*
  Warnings:

  - You are about to drop the `ratings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "isAvailableForAutoSelect" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "public"."ratings";

-- CreateTable
CREATE TABLE "public"."orderRating" (
    "id" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "Rating" DECIMAL(65,30) NOT NULL,
    "Feedback" TEXT,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orderRating_OrderID_key" ON "public"."orderRating"("OrderID");

-- AddForeignKey
ALTER TABLE "public"."orderRating" ADD CONSTRAINT "orderRating_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
