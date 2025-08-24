-- CreateEnum
CREATE TYPE "public"."OtpType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'TWO_FACTOR_AUTH');

-- CreateTable
CREATE TABLE "public"."emailOtps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "type" "public"."OtpType" NOT NULL DEFAULT 'PASSWORD_RESET',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emailOtps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emailOtps_email_idx" ON "public"."emailOtps"("email");

-- CreateIndex
CREATE INDEX "emailOtps_email_type_idx" ON "public"."emailOtps"("email", "type");

-- CreateIndex
CREATE INDEX "emailOtps_expiresAt_idx" ON "public"."emailOtps"("expiresAt");
