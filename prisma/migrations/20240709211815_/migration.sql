/*
  Warnings:

  - A unique constraint covering the columns `[Name]` on the table `attachments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "attachments_Name_key" ON "attachments"("Name");
