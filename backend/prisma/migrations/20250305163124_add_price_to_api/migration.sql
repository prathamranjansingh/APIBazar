-- AlterTable
ALTER TABLE "Api" ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "subscriptionDuration" TEXT;

-- AlterTable
ALTER TABLE "Endpoint" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "headers" DROP NOT NULL,
ALTER COLUMN "requestBody" DROP NOT NULL,
ALTER COLUMN "response" DROP NOT NULL;
