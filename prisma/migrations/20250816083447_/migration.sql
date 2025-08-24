-- AlterTable
ALTER TABLE "public"."orderServices" ADD COLUMN     "ServiceID" INTEGER,
ALTER COLUMN "ProviderServiceBodyTypeID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."orderServices" ADD CONSTRAINT "orderServices_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
