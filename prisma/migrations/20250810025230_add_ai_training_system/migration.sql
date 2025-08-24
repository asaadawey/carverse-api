-- CreateTable
CREATE TABLE "public"."aiTrainingData" (
    "id" SERIAL NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userRating" INTEGER NOT NULL,
    "wasHelpful" BOOLEAN NOT NULL,
    "improvementAreas" TEXT[],
    "correctResponse" TEXT,
    "contextData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aiTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aiPositiveExamples" (
    "id" SERIAL NOT NULL,
    "userMessage" TEXT NOT NULL,
    "correctResponse" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aiPositiveExamples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aiPerformanceMetrics" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "helpfulResponsesCount" INTEGER NOT NULL DEFAULT 0,
    "escalationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commonFailurePoints" TEXT[],

    CONSTRAINT "aiPerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aiTrainingData_conversationId_idx" ON "public"."aiTrainingData"("conversationId");

-- CreateIndex
CREATE INDEX "aiTrainingData_createdAt_idx" ON "public"."aiTrainingData"("createdAt");

-- CreateIndex
CREATE INDEX "aiPositiveExamples_rating_idx" ON "public"."aiPositiveExamples"("rating");

-- CreateIndex
CREATE INDEX "aiPositiveExamples_createdAt_idx" ON "public"."aiPositiveExamples"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "aiPerformanceMetrics_date_key" ON "public"."aiPerformanceMetrics"("date");

-- CreateIndex
CREATE INDEX "aiPerformanceMetrics_date_idx" ON "public"."aiPerformanceMetrics"("date");
