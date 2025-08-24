-- CreateEnum
CREATE TYPE "public"."ChatMessageType" AS ENUM ('USER', 'AI_AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ChatSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'TRANSFERRED_TO_HUMAN');

-- CreateTable
CREATE TABLE "public"."chatSessions" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Status" "public"."ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "StartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EndedAt" TIMESTAMP(3),
    "Context" JSONB,
    "OrderID" INTEGER,
    "ModuleID" INTEGER,

    CONSTRAINT "chatSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chatMessages" (
    "id" SERIAL NOT NULL,
    "SessionID" INTEGER NOT NULL,
    "MessageType" "public"."ChatMessageType" NOT NULL,
    "Content" TEXT NOT NULL,
    "Metadata" JSONB,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aiAgentIntents" (
    "id" SERIAL NOT NULL,
    "IntentName" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Keywords" TEXT[],
    "ResponseTemplate" TEXT NOT NULL,
    "RequiresData" BOOLEAN NOT NULL DEFAULT false,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aiAgentIntents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aiAgentIntents_IntentName_key" ON "public"."aiAgentIntents"("IntentName");

-- AddForeignKey
ALTER TABLE "public"."chatSessions" ADD CONSTRAINT "chatSessions_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatSessions" ADD CONSTRAINT "chatSessions_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatSessions" ADD CONSTRAINT "chatSessions_ModuleID_fkey" FOREIGN KEY ("ModuleID") REFERENCES "public"."modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatMessages" ADD CONSTRAINT "chatMessages_SessionID_fkey" FOREIGN KEY ("SessionID") REFERENCES "public"."chatSessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
