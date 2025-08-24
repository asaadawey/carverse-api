-- CreateEnum
CREATE TYPE "public"."OrderSubmissionType" AS ENUM ('PROVIDER_SELECT', 'AUTO_SELECT');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "OrderSubmissionType" "public"."OrderSubmissionType" NOT NULL DEFAULT 'PROVIDER_SELECT',
ADD COLUMN     "OrderTimeoutSeconds" INTEGER NOT NULL DEFAULT 1800;
