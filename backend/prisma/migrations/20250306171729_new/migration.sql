/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `ApiAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `Endpoint` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiId,path,method]` on the table `Endpoint` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,apiId]` on the table `PurchasedAPI` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,apiId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lastUpdated` to the `ApiAnalytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Endpoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Endpoint` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('API_PURCHASED', 'PURCHASE_CONFIRMED', 'API_UPDATED', 'NEW_REVIEW', 'RATE_LIMIT_REACHED', 'PAYMENT_RECEIVED', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "ApiAnalytics" DROP CONSTRAINT "ApiAnalytics_apiId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_apiId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Endpoint" DROP CONSTRAINT "Endpoint_apiId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "PurchasedAPI" DROP CONSTRAINT "PurchasedAPI_apiId_fkey";

-- DropForeignKey
ALTER TABLE "PurchasedAPI" DROP CONSTRAINT "PurchasedAPI_userId_fkey";

-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "rateLimit" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "ApiAnalytics" DROP COLUMN "updatedAt",
ADD COLUMN     "failedCalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "successCalls" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Endpoint" DROP COLUMN "response",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rateLimit" INTEGER,
ADD COLUMN     "responseSchema" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "company" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,
    "ip" TEXT,
    "endpoint" TEXT,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "userId" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriggered" TIMESTAMP(3),
    "lastStatus" INTEGER,
    "failCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitLog_apiKeyId_timestamp_idx" ON "RateLimitLog"("apiKeyId", "timestamp");

-- CreateIndex
CREATE INDEX "Webhook_apiId_isActive_idx" ON "Webhook"("apiId", "isActive");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_apiId_userId_idx" ON "ApiKey"("apiId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_apiId_path_method_key" ON "Endpoint"("apiId", "path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedAPI_userId_apiId_key" ON "PurchasedAPI"("userId", "apiId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_apiId_key" ON "Review"("userId", "apiId");

-- CreateIndex
CREATE INDEX "Transaction_sellerId_idx" ON "Transaction"("sellerId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAnalytics" ADD CONSTRAINT "ApiAnalytics_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitLog" ADD CONSTRAINT "RateLimitLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedAPI" ADD CONSTRAINT "PurchasedAPI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedAPI" ADD CONSTRAINT "PurchasedAPI_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
