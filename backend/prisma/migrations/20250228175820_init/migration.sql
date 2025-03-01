/*
  Warnings:

  - Added the required column `headers` to the `Endpoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestBody` to the `Endpoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `response` to the `Endpoint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "rateLimit" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "Endpoint" ADD COLUMN     "headers" JSONB NOT NULL,
ADD COLUMN     "requestBody" JSONB NOT NULL,
ADD COLUMN     "response" JSONB NOT NULL;
