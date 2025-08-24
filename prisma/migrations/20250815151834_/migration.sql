-- AlterTable
ALTER TABLE "public"."orderAmountStatements" ADD COLUMN     "RelatedServiceID" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedServiceID_fkey" FOREIGN KEY ("RelatedServiceID") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
