-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."supportRequests" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "relatedOrderId" INTEGER,
    "issueDescription" TEXT NOT NULL,
    "contactUserByRegisteredMobile" BOOLEAN NOT NULL DEFAULT false,
    "sendEmail" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supportRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supportRequests_status_idx" ON "public"."supportRequests"("status");

-- CreateIndex
CREATE INDEX "supportRequests_createdAt_idx" ON "public"."supportRequests"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."supportRequests" ADD CONSTRAINT "supportRequests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supportRequests" ADD CONSTRAINT "supportRequests_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
