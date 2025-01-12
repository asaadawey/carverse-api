-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "AdditionalNotes" TEXT;

-- CreateTable
CREATE TABLE "deleteRequests" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "DeletedBy" INTEGER NOT NULL,
    "Comments" TEXT,
    "ProcessedOn" TIMESTAMP(3),
    "IsProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ProcessedBy" INTEGER,
    "CreatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deleteRequests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deleteRequests" ADD CONSTRAINT "deleteRequests_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deleteRequests" ADD CONSTRAINT "deleteRequests_DeletedBy_fkey" FOREIGN KEY ("DeletedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deleteRequests" ADD CONSTRAINT "deleteRequests_ProcessedBy_fkey" FOREIGN KEY ("ProcessedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
