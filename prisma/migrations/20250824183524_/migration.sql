/*
  Warnings:

  - Added the required column `canUploadFromCamera` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canUploadFromGallery` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."attachments" ADD COLUMN     "canUploadFromCamera" BOOLEAN NOT NULL,
ADD COLUMN     "canUploadFromGallery" BOOLEAN NOT NULL;
