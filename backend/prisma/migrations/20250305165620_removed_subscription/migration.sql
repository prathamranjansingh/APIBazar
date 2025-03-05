/*
  Warnings:

  - The values [SUBSCRIPTION] on the enum `PricingModel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `subscriptionDuration` on the `Api` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PricingModel_new" AS ENUM ('FREE', 'PAID');
ALTER TABLE "Api" ALTER COLUMN "pricingModel" TYPE "PricingModel_new" USING ("pricingModel"::text::"PricingModel_new");
ALTER TYPE "PricingModel" RENAME TO "PricingModel_old";
ALTER TYPE "PricingModel_new" RENAME TO "PricingModel";
DROP TYPE "PricingModel_old";
COMMIT;

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "subscriptionDuration";
