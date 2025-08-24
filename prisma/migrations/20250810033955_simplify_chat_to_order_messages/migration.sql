/*
  Warnings:

  - You are about to drop the `chatConversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatTypingStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `providerCustomerMessages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userOnlineStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."OrderMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'LOCATION', 'VOICE', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "public"."chatConversations" DROP CONSTRAINT "chatConversations_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatConversations" DROP CONSTRAINT "chatConversations_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatConversations" DROP CONSTRAINT "chatConversations_providerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatParticipants" DROP CONSTRAINT "chatParticipants_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatParticipants" DROP CONSTRAINT "chatParticipants_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatTypingStatus" DROP CONSTRAINT "chatTypingStatus_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatTypingStatus" DROP CONSTRAINT "chatTypingStatus_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."providerCustomerMessages" DROP CONSTRAINT "providerCustomerMessages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."providerCustomerMessages" DROP CONSTRAINT "providerCustomerMessages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."providerCustomerMessages" DROP CONSTRAINT "providerCustomerMessages_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "public"."providerCustomerMessages" DROP CONSTRAINT "providerCustomerMessages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."userOnlineStatus" DROP CONSTRAINT "userOnlineStatus_userId_fkey";

-- DropTable
DROP TABLE "public"."chatConversations";

-- DropTable
DROP TABLE "public"."chatParticipants";

-- DropTable
DROP TABLE "public"."chatTypingStatus";

-- DropTable
DROP TABLE "public"."providerCustomerMessages";

-- DropTable
DROP TABLE "public"."userOnlineStatus";

-- DropEnum
DROP TYPE "public"."ChatConversationStatus";

-- DropEnum
DROP TYPE "public"."MessageStatus";

-- DropEnum
DROP TYPE "public"."ProviderChatMessageType";

-- CreateTable
CREATE TABLE "public"."orderMessages" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "messageType" "public"."OrderMessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replyToId" TEXT,

    CONSTRAINT "orderMessages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orderMessages_orderId_idx" ON "public"."orderMessages"("orderId");

-- CreateIndex
CREATE INDEX "orderMessages_senderId_idx" ON "public"."orderMessages"("senderId");

-- CreateIndex
CREATE INDEX "orderMessages_createdAt_idx" ON "public"."orderMessages"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."orderMessages" ADD CONSTRAINT "orderMessages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orderMessages" ADD CONSTRAINT "orderMessages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orderMessages" ADD CONSTRAINT "orderMessages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."orderMessages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
