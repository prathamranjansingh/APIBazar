/*
  Warnings:

  - Added the required column `paymentId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformFee` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerReceives` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tds` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "paymentId" TEXT NOT NULL,
ADD COLUMN     "platformFee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "sellerReceives" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tds" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "transferError" TEXT,
ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "transferStatus" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingStatus" TEXT,
ADD COLUMN     "razorpayAccountId" TEXT;
