-- AlterTable
ALTER TABLE "public"."orderAmountStatements" ADD COLUMN     "DiscountAmount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "RelatedVoucherID" INTEGER;

-- CreateTable
CREATE TABLE "public"."vouchers" (
    "id" SERIAL NOT NULL,
    "Code" TEXT NOT NULL,
    "DiscountPercentage" DECIMAL(65,30) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_Code_key" ON "public"."vouchers"("Code");

-- AddForeignKey
ALTER TABLE "public"."orderAmountStatements" ADD CONSTRAINT "orderAmountStatements_RelatedVoucherID_fkey" FOREIGN KEY ("RelatedVoucherID") REFERENCES "public"."vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
