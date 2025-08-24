-- CreateEnum
CREATE TYPE "public"."ChatConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."ProviderChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'LOCATION', 'VOICE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "public"."chatConversations" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "status" "public"."ChatConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "chatConversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providerCustomerMessages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "messageType" "public"."ProviderChatMessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "replyToId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "providerCustomerMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chatParticipants" (
    "id" SERIAL NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chatParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chatTypingStatus" (
    "id" SERIAL NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "startedTypingAt" TIMESTAMP(3),
    "lastTypingAt" TIMESTAMP(3),

    CONSTRAINT "chatTypingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userOnlineStatus" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "deviceInfo" JSONB,
    "socketId" TEXT,

    CONSTRAINT "userOnlineStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chatConversations_customerId_idx" ON "public"."chatConversations"("customerId");

-- CreateIndex
CREATE INDEX "chatConversations_providerId_idx" ON "public"."chatConversations"("providerId");

-- CreateIndex
CREATE INDEX "chatConversations_orderId_idx" ON "public"."chatConversations"("orderId");

-- CreateIndex
CREATE INDEX "chatConversations_lastMessageAt_idx" ON "public"."chatConversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "providerCustomerMessages_conversationId_idx" ON "public"."providerCustomerMessages"("conversationId");

-- CreateIndex
CREATE INDEX "providerCustomerMessages_senderId_idx" ON "public"."providerCustomerMessages"("senderId");

-- CreateIndex
CREATE INDEX "providerCustomerMessages_receiverId_idx" ON "public"."providerCustomerMessages"("receiverId");

-- CreateIndex
CREATE INDEX "providerCustomerMessages_createdAt_idx" ON "public"."providerCustomerMessages"("createdAt");

-- CreateIndex
CREATE INDEX "providerCustomerMessages_status_idx" ON "public"."providerCustomerMessages"("status");

-- CreateIndex
CREATE INDEX "chatParticipants_userId_idx" ON "public"."chatParticipants"("userId");

-- CreateIndex
CREATE INDEX "chatParticipants_isOnline_idx" ON "public"."chatParticipants"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "chatParticipants_conversationId_userId_key" ON "public"."chatParticipants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "chatTypingStatus_conversationId_idx" ON "public"."chatTypingStatus"("conversationId");

-- CreateIndex
CREATE INDEX "chatTypingStatus_isTyping_idx" ON "public"."chatTypingStatus"("isTyping");

-- CreateIndex
CREATE UNIQUE INDEX "chatTypingStatus_conversationId_userId_key" ON "public"."chatTypingStatus"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "userOnlineStatus_userId_key" ON "public"."userOnlineStatus"("userId");

-- CreateIndex
CREATE INDEX "userOnlineStatus_isOnline_idx" ON "public"."userOnlineStatus"("isOnline");

-- CreateIndex
CREATE INDEX "userOnlineStatus_lastSeenAt_idx" ON "public"."userOnlineStatus"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "public"."chatConversations" ADD CONSTRAINT "chatConversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatConversations" ADD CONSTRAINT "chatConversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatConversations" ADD CONSTRAINT "chatConversations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providerCustomerMessages" ADD CONSTRAINT "providerCustomerMessages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."chatConversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providerCustomerMessages" ADD CONSTRAINT "providerCustomerMessages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providerCustomerMessages" ADD CONSTRAINT "providerCustomerMessages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providerCustomerMessages" ADD CONSTRAINT "providerCustomerMessages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."providerCustomerMessages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatParticipants" ADD CONSTRAINT "chatParticipants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."chatConversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatParticipants" ADD CONSTRAINT "chatParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatTypingStatus" ADD CONSTRAINT "chatTypingStatus_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."chatConversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chatTypingStatus" ADD CONSTRAINT "chatTypingStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userOnlineStatus" ADD CONSTRAINT "userOnlineStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
