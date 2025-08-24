-- AlterTable
ALTER TABLE "public"."orderRating" ADD COLUMN     "Notes" TEXT,
ADD COLUMN     "isOrderCompleted" BOOLEAN NOT NULL DEFAULT false;
